describe('Worker Registrations', () => {
  beforeEach(() => navigator.serviceWorker.getRegistrations()
    .then(registrations => Promise.all(registrations.map((registration) => {
      console.log(registration);
      return registration.unregister();
    }))));

  it('should register a worker', () => {
    navigator.serviceWorker.register('/bundle.js', { scope: '/' }).then((reg) => {
      console.log(reg);
      reg.onupdatefound = ev => console.log(ev);
    });
  });
});
