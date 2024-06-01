import type { Express } from 'express';

import session from 'express-session';

import handleDiscord from './handleDiscord';
import handleGitHub from './handleGitHub';
import passport from './passport';

const connectionRoutes = (app: Express) => {
  app.use(
    session({
      resave: true,
      saveUninitialized: true,
      secret: process.env.SECRET!
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());

  handleGitHub(app);
  handleDiscord(app);
};

export default connectionRoutes;
