// 检查cookie是否存在
checkCookie = () => {
    if (document.cookie.indexOf('user') === -1) {
    window.location.href = '/login.html'
    }
}

window.addEventListener('load', checkCookie);