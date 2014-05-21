angular.element(document).ready(function() {
  try {
    angular.bootstrap(document.body, ['angularMapbox']);
  } catch(e) {
    console.log('angularMapbox was already loaded');
  }
});
