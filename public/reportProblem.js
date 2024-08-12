// Image preview functionality
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const nameInStorage = localStorage.getItem('name');

if (nameInStorage != null) {
    document.getElementById('name').value = nameInStorage
}

function saveName() {
    const nameInput = document.getElementById('name');
    localStorage.setItem('name', nameInput.value);
}

imageInput.addEventListener('change', function () {
    const file = imageInput.files[0];
    saveName()
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            imagePreview.innerHTML = `<img src="${e.target.result}" alt="Selected Image">`;
        }
        reader.readAsDataURL(file);
    }
});
