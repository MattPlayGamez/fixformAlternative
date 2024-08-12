

function showQRCode(src) {
    document.getElementById('qrImage').src = src;
    document.getElementById('qrModal').style.display = 'block';
}

// Function to close the QR code modal
function closeQRCode() {
    document.getElementById('qrModal').style.display = 'none';
}

// Close the modal if the user clicks anywhere outside of it
window.onclick = function(event) {
    if (event.target == document.getElementById('qrModal')) {
        closeQRCode();
    }
}