import routes from "webpack-fsr-plugin/routes";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

const router = createBrowserRouter(
  routes.map(({ path, sync, async: lazy }) => ({
    path: path,
    loader: sync.loader,
    lazy: () =>
      lazy().then((module) => ({
        Component: module.default,
      })),
  }))
);

export const AppRouter = () => <RouterProvider router={router} />;
