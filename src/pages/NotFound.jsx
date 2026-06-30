import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="grid min-h-screen place-items-center bg-forest px-6 text-center text-white">
      <div>
        <p className="font-display text-7xl text-lime">404</p>
        <h1 className="mt-4 text-2xl">This court doesn't exist.</h1>
        <p className="mt-2 text-white/60">The page you're looking for is out of bounds.</p>
        <Link to="/" className="btn-lime mt-8">
          Back to home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
