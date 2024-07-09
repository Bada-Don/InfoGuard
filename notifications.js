document.addEventListener('DOMContentLoaded', function() {
    var error = document.getElementById('error-message').textContent;
    var success = document.getElementById('success-message').textContent;
    
    if (error) {
      toastr.error(error);
    }
    if (success) {
      toastr.success(success);
    }
  });