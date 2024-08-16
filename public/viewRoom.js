let input = document.getElementById('docUpload')
let uploadForm = document.getElementById('uploadbtn')
input.addEventListener('change', () => {
    uploadForm.click()
    // window.location.reload()
})
document.addEventListener("DOMContentLoaded", function () {
    const hoverLink = document.getElementById("hover-link");
    const iframe = document.getElementById("preview-file");
    iframe.style.display = "none"

    hoverLink.addEventListener("mouseenter", (ev) => {
        iframe.src = hoverLink.href;
        iframe.style.display = "block";
    })

    iframe.addEventListener("mouseleave", () => {
        var fadeTarget = iframe;
        var fadeEffect = setInterval(function () {
            if (!fadeTarget.style.opacity) {
                fadeTarget.style.opacity = 1;
            }
            if (fadeTarget.style.opacity > 0) {
                fadeTarget.style.opacity -= 0.1;
            } else {
                clearInterval(fadeEffect);
                fadeTarget.style.display = "none";
            }
        }, 50);
        // iframe.style.display = "none";


    })
    // hoverLink.addEventListener('mouseleave', (ev) => {
    //     setTimeout(() => {

    //         iframe.src = "";
    //         iframe.style.display = "none";
    //     }, 500);
    // })


    // hoverLink.addEventListener("mouseenter", function(event) {
    //     iframe.src = hoverLink.href;
    //     iframe.style.display = "block";
    // });

    // hoverLink.addEventListener("mouseleave", function(event) {
    //     iframe.style.display = "none";
    // });
});