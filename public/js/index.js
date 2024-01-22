// 检查cookie是否存在
checkCookie = () => {
    if (document.cookie.indexOf('jwt') === -1) {
        window.location.href = '/login'
        console.log('cookie not found')
    }
}

function logout() {
    // 删除cookie
    document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    // 重定向到登录页面
    window.location.href = '/login';
}

window.addEventListener('load', checkCookie);

function dragContainer(h1){
    // 防止拖动title
    if (h1.id == 'title') {
        return;
    }

    // 将h1设置为不可选中
    h1.style.userSelect = 'none';

    var container = h1.parentElement;
    
      // 在元素内部的相对位置
    var shiftX = event.clientX - container.getBoundingClientRect().left;
    var shiftY = event.clientY - container.getBoundingClientRect().top;

    // 获取元素现在的大小
    var width = container.getBoundingClientRect().width;
    var height = container.getBoundingClientRect().height;

    // 设置元素的新大小为原来一样，防止变形
    container.style.width = width + 'px';
    container.style.height = height + 'px';

    container.style.boxShadow = '0 0 0 10000px rgba(0, 0, 0, 0.5)';

    // 将元素设置为绝对定位，取消resize
    container.style.position = 'absolute';
    container.style.zIndex = 1000;
    document.body.append(container);
    moveAt(event.pageX, event.pageY);

      // 将元素移到新位置
    function moveAt(pageX, pageY) {
        container.style.left = pageX - shiftX + 'px';
        container.style.top = pageY - shiftY + 'px';
    }

    function onMouseMove(event) {
        moveAt(event.pageX, event.pageY);
    }

    // 在 mouseup 事件上移动监听器
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', function() {
        document.removeEventListener('mousemove', onMouseMove);
        container.onmouseup = null;
        container.style.width = width + 'px';
        container.style.height = height + 'px';
        container.style.zIndex = 0;
        container.style.boxShadow = '1px 1px 10px #ccc';

        // 获取container的id
        var id = container.id;
        // 储存container的位置到localStorage
        var left = container.style.left;
        var top = container.style.top;
        localStorage.setItem(id, left + ',' + top);
    });

    container.ondragstart = function() {
        return false;
    };
}
window.addEventListener('load', () => {
    var containers = document.getElementsByName('container');
    // 读取localStorage
    var keys = Object.keys(localStorage);
    for (var i = 0; i < keys.length; i++) {
        try {
            if (keys[i] == 'settings') {
                continue;
            }
            var id = keys[i];
            var left = localStorage.getItem(id).split(',')[0];
            var top = localStorage.getItem(id).split(',')[1];
            var container = document.getElementById(id);
            container.style.left = left;
            container.style.top = top;
        }catch(err) {
            console.log(err);
        }
    }

    // 显示所有的name=container的元素
    for (var i = 0; i < containers.length; i++) {
        containers[i].style.display = 'block';
    }
});

window.addEventListener('load', () => {
    // 找到所有的h1元素
    var h1s = document.getElementsByTagName('h1');
    // 为每一个h1元素添加拖拽事件
    for (var i = 0; i < h1s.length; i++) {
        h1s[i].onmousedown = function() {
            dragContainer(this);
        }
    }
    // 移动端阻止container的拖动
    for (var i = 0; i < h1s.length; i++) {
        h1s[i].addEventListener('touchstart', function(e) {
            e.preventDefault();
        });
    }
});
