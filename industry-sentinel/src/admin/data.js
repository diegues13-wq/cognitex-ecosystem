export const MOCK_TENANTS = [
    {
        id: "org_001",
        name: "AgroFarms Ltd.",
        plan: "Enterprise",
        status: "Active",
        users: 12,
        sensors: 45,
        usage: {
            storage_gb: 4.2,
            api_calls: 12500,
            monthly_cost: 299.00
        }
    },
    {
        id: "org_002",
        name: "TechSteel Corp",
        plan: "Pro",
        status: "Active",
        users: 5,
        sensors: 12,
        usage: {
            storage_gb: 1.1,
            api_calls: 3200,
            monthly_cost: 99.00
        }
    },
    {
        id: "org_003",
        name: "BetaTesting Inc",
        plan: "Free",
        status: "Suspended",
        users: 1,
        sensors: 2,
        usage: {
            storage_gb: 0.2,
            api_calls: 400,
            monthly_cost: 0.00
        }
    }
];
