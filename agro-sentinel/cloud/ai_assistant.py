import functions_framework
import logging
import os
from google.cloud import bigquery
from vertexai.preview.generative_models import GenerativeModel

# Initialize clients
bq_client = bigquery.Client()

# Configure Vertex AI
# vertexai.init(location="us-central1") # Env var usually handles project
model = GenerativeModel("gemini-pro")

SCHEMA_CONTEXT = """
Table: agro_sentinel_data.sensor_logs
Columns:
- sensor_id (STRING): ID of the greenhouse (e.g., GH-ECU-01)
- timestamp (TIMESTAMP): Time of reading
- temperature (FLOAT): Celsius
- humidity (FLOAT): Relative Humidity %
- soil_moisture (FLOAT): %
"""

@functions_framework.http
def ask_ai(request):
    """
    HTTP Function: Takes a JSON payload {"query": "message"} 
    and returns a natural language answer based on data.
    """
    # CORS handling
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)

    headers = {'Access-Control-Allow-Origin': '*'}

    request_json = request.get_json(silent=True)
    if not request_json or 'query' not in request_json:
        return ({"error": "Missing 'query' in payload"}, 400, headers)

    user_query = request_json['query']
    logging.info(f"AI Query received: {user_query}")

    try:
        # 1. Prompt Gemini to generate SQL
        prompt = f"""
        You are a data analyst for Agro-Sentinel.
        Context: {SCHEMA_CONTEXT}
        
        Task: Convert this user question into a Standard SQL query for BigQuery.
        Question: "{user_query}"
        
        Rules:
        - Return ONLY the SQL query. No markdown, no explanations.
        - Use specific table name: `agro_sentinel_data.sensor_logs`
        - If the question is not about data (e.g. "Hi"), return "Conversational"
        """
        
        # MOCK RESPONSE for Local Execution (if Vertex not auth'd)
        if os.environ.get('MOCK_AI') == 'true':
            sql_query = "SELECT AVG(temperature) as avg_temp FROM `agro_sentinel_data.sensor_logs` WHERE timestamp > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)"
        else:
            response = model.generate_content(prompt)
            sql_query = response.text.strip().replace("```sql", "").replace("```", "")

        logging.info(f"Generated SQL: {sql_query}")

        if sql_query == "Conversational":
             return ({"answer": "Hello! I am Agro-Sentinel AI. Ask me about temperature, humidity, or soil moisture trends."}, 200, headers)

        # 2. Execute SQL
        # Mock execution for MVP if no real DB
        if os.environ.get('MOCK_DB') == 'true':
             rows = [{"avg_temp": 24.5}]
        else:
             query_job = bq_client.query(sql_query)
             rows = [dict(row) for row in query_job]

        # 3. Summarize Answer
        summary_prompt = f"""
        User Question: "{user_query}"
        Data Result: {rows}
        
        Task: Answer the user's question in a friendly, professional sentence based on the data.
        """
        
        if os.environ.get('MOCK_AI') == 'true':
            final_answer = f"Based on the last 24 hours, the average temperature was {rows[0]['avg_temp']}°C."
        else:
            final_response = model.generate_content(summary_prompt)
            final_answer = final_response.text

        return ({"answer": final_answer, "sql": sql_query}, 200, headers)

    except Exception as e:
        logging.error(f"AI Error: {e}")
        return ({"error": str(e)}, 500, headers)
