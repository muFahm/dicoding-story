import HomePage from '../pages/home/home-page';
import AboutPage from '../pages/about/about-page';
import LoginPage from '../pages/auth/login-page';
import RegisterPage from '../pages/auth/register-page';
import AddStoryPage from '../pages/story/add-story-page';
import DetailStoryPage from '../pages/story/detail-story-page';

// Kembalikan ke bentuk asli - perbedaannya saat instansiasi
const routes = {
  '/': HomePage,
  '/about': AboutPage,
  '/login': LoginPage,
  '/register': RegisterPage,
  '/add': AddStoryPage,  
  '/story/:id': DetailStoryPage,
};

export default routes;