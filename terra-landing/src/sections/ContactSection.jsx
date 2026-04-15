import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

// Reemplaza con tu Form ID de Formspree: https://formspree.io
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID';

const ContactSection = () => {
  const { t } = useTranslation();

  const [form, setForm] = useState({ name: '', company: '', email: '', interest: '', message: '' });
  const [privacy, setPrivacy] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!privacy) return;
    setStatus('loading');
    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(form),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  };

  const inputClass = "w-full bg-black/30 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-secondary-fixed focus:bg-black/50 transition-all placeholder-white/40";

  return (
    <section id="contact" className="snap-section bg-[#0a0a0a] relative overflow-hidden flex-col">
      <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-secondary-fixed/5 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6 }}
        className="max-w-screen-xl mx-auto px-6 md:px-12 relative z-10 w-full"
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center mb-6 md:mb-10 pt-[calc(72px+1.5rem)]"
        >
          <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl font-bold text-surface-bright tracking-tight mb-4">{t('contact.title')}</h2>
          <p className="font-body text-sm md:text-base text-white/60 font-light max-w-2xl mx-auto">{t('contact.desc')}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-12 lg:gap-20 items-start">

          {/* Canales */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:border-secondary-fixed/30 transition-all group">
              <div className="w-14 h-14 rounded-full bg-secondary-fixed/20 flex items-center justify-center mb-6 text-secondary-fixed group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">mail</span>
              </div>
              <h4 className="font-bold text-white text-xl mb-2">{t('contact_ui.email_title')}</h4>
              <p className="text-white/60 mb-4 font-light leading-relaxed">{t('contact_ui.email_desc')}</p>
              <a href="mailto:export@terralatitude.com" className="text-secondary-fixed font-bold hover:underline">export@terralatitude.com</a>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:border-[#25D366]/30 transition-all group">
              <div className="w-14 h-14 rounded-full bg-[#25D366]/20 flex items-center justify-center mb-6 text-[#25D366] group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl animate-pulse">sms</span>
              </div>
              <h4 className="font-bold text-white text-xl mb-2">{t('contact_ui.wa_title')}</h4>
              <p className="text-white/60 mb-6 font-light leading-relaxed">{t('contact_ui.wa_desc')}</p>
              <a
                href="https://wa.me/593999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] text-white px-8 py-4 rounded-full font-bold hover:shadow-[0_0_20px_rgba(37,211,102,0.4)] transition-all"
              >
                {t('contact_ui.wa_cta')}
                <span className="material-symbols-outlined text-lg">open_in_new</span>
              </a>
            </div>
          </div>

          {/* Formulario */}
          <div className="lg:col-span-6 bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            <h3 className="font-headline text-xl md:text-2xl font-bold text-white mb-5">{t('contact_ui.form_title')}</h3>

            {status === 'success' ? (
              <div className="flex flex-col items-center gap-4 py-12 text-center">
                <span className="material-symbols-outlined text-5xl text-emerald-400">check_circle</span>
                <p className="text-white font-bold text-lg">{t('contact_ui.form_success')}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-secondary-fixed transition-colors pointer-events-none">person</span>
                    <input type="text" name="name" value={form.name} onChange={handleChange} placeholder={t('contact_ui.pl_name')} required className={inputClass} />
                  </div>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-secondary-fixed transition-colors pointer-events-none">business</span>
                    <input type="text" name="company" value={form.company} onChange={handleChange} placeholder={t('contact_ui.pl_company')} className={inputClass} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-secondary-fixed transition-colors pointer-events-none">alternate_email</span>
                    <input type="email" name="email" value={form.email} onChange={handleChange} placeholder={t('contact_ui.pl_email')} required className={inputClass} />
                  </div>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-secondary-fixed transition-colors pointer-events-none">inbox</span>
                    <select name="interest" value={form.interest} onChange={handleChange} className="w-full bg-black/30 border border-white/10 rounded-xl py-4 pl-12 pr-10 text-white/70 focus:outline-none focus:border-secondary-fixed focus:bg-black/50 transition-all appearance-none cursor-pointer hover:text-white">
                      <option value="" disabled className="text-black bg-white">{t('contact_ui.pl_interest')}</option>
                      <option value="cacao"  className="text-black bg-white">{t('contact_ui.pl_cacao')}</option>
                      <option value="cafe"   className="text-black bg-white">{t('contact_ui.pl_coffee')}</option>
                      <option value="ambos"  className="text-black bg-white">{t('contact_ui.pl_both')}</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">expand_more</span>
                  </div>
                </div>

                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-5 text-white/30 group-focus-within:text-secondary-fixed transition-colors pointer-events-none">chat_bubble</span>
                  <textarea rows="4" name="message" value={form.message} onChange={handleChange} placeholder={t('contact_ui.pl_msg')} className="w-full bg-black/30 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-secondary-fixed focus:bg-black/50 transition-all placeholder-white/40 resize-none"></textarea>
                </div>

                {/* Checkbox de privacidad */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={privacy}
                    onChange={e => setPrivacy(e.target.checked)}
                    required
                    className="mt-1 w-4 h-4 accent-secondary-fixed shrink-0 cursor-pointer"
                  />
                  <span className="text-white/50 text-xs leading-relaxed group-hover:text-white/70 transition-colors">
                    {t('contact_ui.privacy')}
                  </span>
                </label>

                {status === 'error' && (
                  <p className="text-red-400 text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">error</span>
                    {t('contact_ui.form_error')}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!privacy || status === 'loading'}
                  className="w-full bg-secondary-fixed text-on-secondary-fixed py-4 rounded-xl font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(253,195,77,0.2)] hover:bg-white hover:shadow-[0_0_35px_rgba(253,195,77,0.5)] transition-all flex justify-center items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'loading' ? (
                    <>
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                      {t('contact_ui.form_sending')}
                    </>
                  ) : (
                    <>
                      {t('contact.form_submit')}
                      <span className="material-symbols-outlined text-xl">send</span>
                    </>
                  )}
                </button>

              </form>
            )}
          </div>

        </div>
      </motion.div>
    </section>
  );
};

export default ContactSection;
