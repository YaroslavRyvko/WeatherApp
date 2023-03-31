export function initPreloader() {
    window.onload = function () {
        window.setTimeout(function () {
            document.body.classList.add('loaded');
        }, 300);
    }
}