type Layer = {
  handle: (...args: any[]) => any;
  route?: { stack?: Layer[] };
  name?: string;
};

type StackContainer = {
  stack?: Layer[];
};

const wrapLayerHandler = (layer: Layer) => {
  const originalHandler = layer.handle;
  if (!originalHandler) return;
  if (originalHandler.length === 4) return;

  // Skip Express internal and already wrapped handlers.
  if (layer.name === "bound dispatch") return;
  if ((originalHandler as any).__asyncWrapped) return;

  const wrapped = function wrappedHandler(req: any, res: any, next: any) {
    Promise.resolve(originalHandler(req, res, next)).catch(next);
  };

  (wrapped as any).__asyncWrapped = true;
  layer.handle = wrapped;
};

const walk = (container: StackContainer | undefined) => {
  if (!container?.stack) return;

  for (const layer of container.stack) {
    if (layer.route?.stack?.length) {
      for (const routeLayer of layer.route.stack) {
        wrapLayerHandler(routeLayer);
      }
    }

    // Nested routers are mounted on layer.handle and expose their own stack.
    const nested = layer.handle as StackContainer;
    if (nested?.stack?.length) {
      walk(nested);
    }
  }
};

export const patchAsyncRoutes = (routerOrApp: StackContainer) => {
  walk(routerOrApp);
};
