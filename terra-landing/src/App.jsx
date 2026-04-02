import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Landing from './pages/Landing';

function App() {
  return (
    <div className="bg-[#050505] text-white font-body min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <Landing />
      </div>
      <Footer />
    </div>
  );
}

export default App;
