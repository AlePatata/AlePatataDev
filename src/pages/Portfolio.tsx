import { Layout } from '../components/Layout';
import { Footer } from '../components/Footer';
import { Home } from './Home';
import { About } from './About';
import { Projects } from './Projects';
import { Curriculum } from './Curriculum';

export function Portfolio() {
  return (
    <Layout>
      <Home />
      <About />
      <Projects />
      <Curriculum />
      <Footer />
    </Layout>
  );
}
