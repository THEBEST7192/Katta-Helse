import { useState } from 'react';
import { Phone, MapPin, MessageCircle, Heart, Info, ArrowRight, ExternalLink, Menu, X, Calendar, Clock, User, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [reservation, setReservation] = useState({
    name: '',
    email: '',
    date: '',
    time: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleReservationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Valider åpningstider
    const selectedDate = new Date(reservation.date);
    const day = selectedDate.getDay(); // 0 = Søndag, 1 = Mandag, osv.
    const [hour, minute] = reservation.time.split(':').map(Number);

    let isValidTime = false;
    let errorMessage = "";

    if (day === 0 || day === 6) {
      errorMessage = "Vi har stengt i helgene. Vennligst velg en hverdag.";
    } else {
      if ((day === 1 || day === 2 || day === 4)) {
        if (hour >= 9 && hour < 14) isValidTime = true;
        if (hour === 14 && minute === 0) isValidTime = true;
      } else if (day === 3) {
        if (hour >= 9 && hour < 13) isValidTime = true;
        if (hour === 13 && minute === 0) isValidTime = true;
      } else if (day === 5) {
        if (hour >= 9 && hour < 11) isValidTime = true;
        if (hour === 11 && minute === 0) isValidTime = true;
      }
      
      if (!isValidTime && !errorMessage) {
        errorMessage = `Vi har stengt på det valgte tidspunktet. Se åpningstidene våre lenger ned.`;
      }
    }

    if (!isValidTime) {
      setSubmitStatus({ type: 'error', message: errorMessage });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:6767';
      const response = await fetch(`${apiUrl}/api/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservation),
      });

      if (response.ok) {
        setSubmitStatus({ type: 'success', message: 'Takk! Din reservasjon er mottatt.' });
        setReservation({ name: '', email: '', date: '', time: '', message: '' });
      } else {
        throw new Error('Noe gikk galt. Prøv igjen senere.');
      }
    } catch {
      setSubmitStatus({ type: 'error', message: 'Kunne ikke koble til serveren. Vennligst prøv igjen senere.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAvailableHours = () => {
    if (!reservation.date) return [];
    const day = new Date(reservation.date).getDay();
    if (day === 1 || day === 2 || day === 4) return ['09', '10', '11', '12', '13', '14'];
    if (day === 3) return ['09', '10', '11', '12', '13'];
    if (day === 5) return ['09', '10', '11'];
    return [];
  };

  const getAvailableMinutes = (selectedHour: string) => {
    if (!reservation.date || !selectedHour) return ['00', '15', '30', '45'];
    const day = new Date(reservation.date).getDay();
    
    // Sjekk om dette er siste time for dagen
    const isLastHour = 
      ((day === 1 || day === 2 || day === 4) && selectedHour === '14') ||
      (day === 3 && selectedHour === '13') ||
      (day === 5 && selectedHour === '11');

    return isLastHour ? ['00'] : ['00', '15', '30', '45'];
  };

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Navigasjon */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="Hamar Katedralskole" className="h-10 w-auto" />
            </div>
            
            {/* Desktop Meny */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#kontakt" className="text-sm font-medium hover:text-katta-500 transition-colors">Kontakt</a>
              <a href="#reserver" className="text-sm font-medium hover:text-katta-500 transition-colors">Reserver time</a>
              <a href="#hvor" className="text-sm font-medium hover:text-katta-500 transition-colors">Hvor er vi?</a>
              <a href="#kontakt" className="bg-katta-500 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-katta-600 transition-all shadow-sm active:scale-95">
                Snakk med oss
              </a>
            </div>

            {/* Knapp for mobilmeny */}
            <button 
              className="md:hidden p-2 text-slate-600 hover:text-katta-500 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobilmeny-overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-slate-100 overflow-hidden"
            >
              <div className="px-4 py-6 space-y-4">
                <a 
                  href="#kontakt" 
                  className="block text-lg font-medium text-slate-900"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Kontakt
                </a>
                <a 
                  href="#reserver" 
                  className="block text-lg font-medium text-slate-900"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Reserver time
                </a>
                <a 
                  href="#hvor" 
                  className="block text-lg font-medium text-slate-900"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Hvor er vi?
                </a>
                <a 
                  href="#kontakt" 
                  className="block w-full text-center bg-katta-500 text-white py-3 rounded-3xl font-bold"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Snakk med oss
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main>
        {/* Hero-seksjon */}
        <section className="relative overflow-hidden bg-white pt-36 pb-28 lg:pt-32 lg:pb-40">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div {...fadeIn}>
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
                Skolehelse<span className="text-katta-500">tjenesten</span>
                <span className="block text-2xl sm:text-3xl text-slate-400 mt-2">Hamar katedralskole</span>
              </h1>
              <p className="max-w-2xl mx-auto text-xl text-slate-600 mb-10 leading-relaxed">
                Du kan snakke med oss om alt som har med din helse å gjøre: psykisk helse, fysisk helse, seksualitet og tester for kjønnssykdommer.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="#kontakt" className="inline-flex items-center justify-center px-8 py-4 rounded-3xl bg-katta-500 text-white font-semibold text-lg hover:bg-katta-600 transition-all shadow-sm group">
                  <Phone className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  Bestill time via SMS
                </a>
                <a href="#snapchat" className="inline-flex items-center justify-center px-8 py-4 rounded-3xl bg-white text-slate-900 border-2 border-slate-200 font-semibold text-lg hover:border-katta-300 transition-all group">
                  <MessageCircle className="mr-2 h-5 w-5 text-yellow-500 group-hover:scale-110 transition-transform" />
                  Send oss en Snap
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Funksjoner / Ikoner */}
        <section className="pt-24 pb-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: <Heart className="h-8 w-8 text-rose-500" />, title: "Psykisk Helse", desc: "Vi er her når livet føles vanskelig eller du trenger noen å lufte tankene med." },
                { icon: <Info className="h-8 w-8 text-blue-500" />, title: "Fysisk Helse", desc: "Spørsmål om kropp, søvn, mat eller små plager i hverdagen." },
                { icon: <Heart className="h-8 w-8 text-purple-500" />, title: "Seksualitet", desc: "Prevensjon, testing for kjønnssykdommer og samtaler om seksualitet." }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
                >
                  <div className="mb-4">{item.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-slate-600">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Reservasjonsseksjon */}
        <section id="reserver" className="py-24 bg-katta-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-katta-100"
            >
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold mb-4">Reserver en samtale</h2>
                <p className="text-slate-600">
                  Fyll ut skjemaet under for å be om en samtale. Vi tar kontakt med deg så snart som mulig.
                </p>
              </div>

              <form onSubmit={handleReservationSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <User className="h-4 w-4 text-katta-500" /> Fullt navn
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={reservation.name}
                      onChange={(e) => setReservation({ ...reservation, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-katta-500/20 focus:border-katta-500 transition-all"
                      placeholder="Ditt navn"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-katta-500" /> E-post eller mobil
                    </label>
                    <input
                      type="text"
                      id="email"
                      required
                      value={reservation.email}
                      onChange={(e) => setReservation({ ...reservation, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-katta-500/20 focus:border-katta-500 transition-all"
                      placeholder="Hvordan kan vi nå deg?"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="date" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-katta-500" /> Ønsket dato
                    </label>
                    <input
                      type="date"
                      id="date"
                      required
                      value={reservation.date}
                      onChange={(e) => {
                        setReservation({ ...reservation, date: e.target.value, time: '' });
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-katta-500/20 focus:border-katta-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="time" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-katta-500" /> Ønsket tidspunkt
                    </label>
                    <div className="flex gap-2">
                      <select
                        id="time-hour"
                        required
                        value={reservation.time.split(':')[0] || ''}
                        onChange={(e) => {
                          const newHour = e.target.value;
                          const availableMinutes = getAvailableMinutes(newHour);
                          const currentMinute = reservation.time.split(':')[1] || '00';
                          const finalMinute = availableMinutes.includes(currentMinute) ? currentMinute : '00';
                          setReservation({ ...reservation, time: `${newHour}:${finalMinute}` });
                        }}
                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-katta-500/20 focus:border-katta-500 transition-all bg-white"
                      >
                        <option value="" disabled>Time</option>
                        {getAvailableHours().map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                        {getAvailableHours().length === 0 && (
                          <option disabled>Velg en hverdag først</option>
                        )}
                      </select>
                      <div className="flex items-center text-slate-400 font-bold">:</div>
                      <select
                        id="time-minute"
                        required
                        value={reservation.time.split(':')[1] || ''}
                        onChange={(e) => {
                          const newMinute = e.target.value;
                          const currentHour = reservation.time.split(':')[0] || '09';
                          setReservation({ ...reservation, time: `${currentHour}:${newMinute}` });
                        }}
                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-katta-500/20 focus:border-katta-500 transition-all bg-white"
                      >
                        <option value="" disabled>Min</option>
                        {getAvailableMinutes(reservation.time.split(':')[0]).map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5 font-medium">
                      <Info className="h-3.5 w-3.5 text-katta-500" />
                      Vennligst velg et tidspunkt innenfor våre åpningstider.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-semibold text-slate-700">
                    Hva vil du snakke om? (Valgfritt)
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    value={reservation.message}
                    onChange={(e) => setReservation({ ...reservation, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-katta-500/20 focus:border-katta-500 transition-all resize-none"
                    placeholder="Skriv litt om hva du trenger hjelp til..."
                  />
                </div>

                {submitStatus && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className={`p-4 rounded-xl text-sm font-medium ${
                      submitStatus.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                    }`}
                  >
                    {submitStatus.message}
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-katta-500 text-white py-4 rounded-xl font-bold hover:bg-katta-600 transition-all shadow-md active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Send forespørsel <ArrowRight className="h-5 w-5" /></>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        </section>

        {/* Ansatte og kontakt */}
        <section id="kontakt" className="pt-12 pb-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-8">Vi er her for deg</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-3xl bg-katta-50 border border-katta-100">
                      <h3 className="text-xl font-bold text-katta-900 mb-2">Helsesykepleier Marianne Buvik</h3>
                      <p className="text-slate-700 mb-4">Bestill time via SMS med navn og fødselsdato.</p>
                      <a href="tel:90269665" className="inline-flex items-center font-bold text-katta-600 hover:text-katta-700">
                        <Phone className="mr-2 h-4 w-4" /> 902 69 665
                      </a>
                    </div>
                    
                    <div className="p-6 rounded-3xl bg-katta-50 border border-katta-100">
                      <h3 className="text-xl font-bold text-katta-900 mb-2">Helsesykepleier Hanne Krøtøy</h3>
                      <p className="text-slate-700 mb-4">Bestill time via SMS med navn og fødselsdato.</p>
                      <a href="tel:91248594" className="inline-flex items-center font-bold text-katta-600 hover:text-katta-700">
                        <Phone className="mr-2 h-4 w-4" /> 912 48 594
                      </a>
                    </div>
                  </div>

                  <div className="p-6 rounded-3xl bg-white border border-slate-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-katta-500/10 flex items-center justify-center">
                        <Info className="h-4 w-4 text-katta-600" />
                      </div>
                      <h4 className="font-bold text-slate-900">Åpningstider</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-2">
                        <span className="text-slate-600">Mandag, tirsdag og torsdag</span>
                        <span className="font-bold text-katta-700">09:00 – 14:00</span>
                      </div>
                      <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-2">
                        <span className="text-slate-600">Onsdag</span>
                        <span className="font-bold text-katta-700">09:00 – 13:00</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Fredag</span>
                        <span className="font-bold text-katta-700">09:00 – 11:00</span>
                      </div>
                    </div>
                  </div>
              </div>

              <div id="snapchat" className="relative group">
                <div className="relative bg-white p-8 rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col items-center">
                  <div className="flex items-center gap-4 mb-6 w-full">
                    <div className="p-3 bg-yellow-400 rounded-2xl shrink-0">
                      <MessageCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Send oss en Snap</h3>
                      <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">helsetjenesten</p>
                    </div>
                  </div>
                  <div className="w-64 h-64 mb-6">
                    <img src="/snapchat-qr.jpg" alt="Snapchat QR Code" className="w-full h-full object-contain" />
                  </div>
                  <p className="text-center text-slate-500 text-sm font-medium">Scan koden for å legge oss til</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sted-seksjon */}
        <section id="hvor" className="py-24 bg-katta-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4 text-white">Hvor finner du oss?</h2>
              <p className="text-katta-100 max-w-xl mx-auto text-lg">
                Vi holder til sentralt på skolen for at det skal være lett å stikke innom.
              </p>
            </div>
            <div className="bg-katta-800/50 rounded-3xl p-8 md:p-12 border border-katta-700/50 flex flex-col md:flex-row gap-12 items-center">
              <div className="flex-1 space-y-10">
                <div className="flex gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-katta-500 flex items-center justify-center shrink-0 shadow-sm">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-white">Besøksadresse</h3>
                    <div className="text-katta-100 leading-relaxed">
                      <p className="text-white">Hamar Katedralskole</p>
                      <p>Ringgata 235, 2315 Hamar</p>
                      <p>Fløy 1, 3. etasje (ved Elevtjenesten)</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-katta-500 flex items-center justify-center shrink-0 shadow-sm">
                    <Heart className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1 text-white">Drop-in</h3>
                    <p className="text-katta-100 leading-relaxed">
                      Kom innom hvis døra er åpen. Ingen sak er for liten.
                    </p>
                  </div>
                </div>
                
                <div className="pt-4">
                  <button className="flex items-center gap-2 text-katta-100 font-bold hover:text-white transition-all border-b-2 border-katta-500 hover:border-white pb-1">
                    Se skolen i kart <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 w-full aspect-video bg-katta-950/50 rounded-3xl border border-katta-700/50 flex items-center justify-center overflow-hidden grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer">
                <p className="text-katta-400 italic">Interaktivt kart kommer</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Bunntekst */}
      <footer className="bg-white border-t border-slate-200 pt-10 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-1 md:col-span-2">
              <img src="/logo.svg" alt="Logo" className="h-10 w-auto mb-4" />
              <p className="text-slate-500 max-w-sm text-sm">
                En del av Innlandet fylkeskommune. Vi jobber for å fremme god helse og trivsel blant våre elever.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-3">Lenker</h4>
              <ul className="space-y-2 text-slate-600">
                <li><a href="#" className="hover:text-katta-500 transition-colors">Utdanningstilbud</a></li>
                <li><a href="#" className="hover:text-katta-500 transition-colors">For elever</a></li>
                <li><a href="#" className="hover:text-katta-500 transition-colors">Om skolen</a></li>
                <li><a href="#" className="hover:text-katta-500 transition-colors">Kontakt oss</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3">Ressurser</h4>
              <ul className="space-y-2 text-slate-600">
                <li><a href="https://innlandetfylke.no/om-fylkeskommunen/personvern/" target="_blank" className="flex items-center gap-1 hover:text-katta-500">Personvern <ExternalLink className="h-3 w-3" /></a></li>
                <li><a href="https://innlandetfylke.no/om-fylkeskommunen/informasjonskapsler/" target="_blank" className="flex items-center gap-1 hover:text-katta-500">Informasjonskapsler <ExternalLink className="h-3 w-3" /></a></li>
                <li><a href="https://uustatus.no/nb/erklaringer/publisert/947710bb-4ba7-43d7-8638-def79b4ab3dd" target="_blank" className="flex items-center gap-1 hover:text-katta-500">Tilgjengelighetserklæring <ExternalLink className="h-3 w-3" /></a></li>
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-xs italic">
              Dette er en demoside, ikke den offisielle siden.
            </p>
            <div className="flex gap-6">
              <a href="https://www.facebook.com/hamarkatedralskole/" target="_blank" className="text-slate-400 hover:text-blue-600 transition-colors">
                <span className="sr-only">Facebook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://www.instagram.com/hamarkatedralskole1153/" target="_blank" className="text-slate-400 hover:text-pink-600 transition-colors">
                <span className="sr-only">Instagram</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.332 3.608 1.308.975.975 1.245 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.332 2.633-1.308 3.608-.975.975-2.242 1.245-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.332-3.608-1.308-.975-.975-1.245-2.242-1.308-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.332-2.633 1.308-3.608.975-.975 2.242-1.245 3.608-1.308 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-1.334.06-2.244.272-3.04.581-.824.319-1.522.747-2.217 1.442-.695.695-1.123 1.392-1.442 2.217-.309.796-.521 1.706-.581 3.04-.058 1.28-.072 1.688-.072 4.947s.014 3.667.072 4.947c.06 1.334.272 2.244.581 3.04.319.824.747 1.522 1.442 2.217.695.695 1.392 1.123 2.217 1.442.796.309 1.706.521 3.04.581 1.28.058 1.688.072 4.947.072s3.667-.014 4.947-.072c1.334-.06 2.244-.272 3.04-.581.824-.319 1.522-.747 2.217-1.442.695-.695 1.123-1.392 1.442-2.217.309-.796.521-1.706.581-3.04.058-1.28.072-1.688.072-4.947s-.014-3.667-.072-4.947c-.06-1.334-.272-2.244-.581-3.04-.319-.824-.747-1.522-1.442-2.217-.695-.695-1.392-1.123-2.217-1.442-.796-.309-1.706-.521-3.04-.581-1.28-.058-1.688-.072-4.947-.072z"/><path d="M12 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.209-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
