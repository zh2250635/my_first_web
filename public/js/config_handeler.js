function submitConfigForm() {
    // 隐藏提交按钮
    let button_to_hide = document.getElementById('config_settings_submit');
    button_to_hide.style.display = 'none';
    var myForm =  document.getElementById('config_settings_form');
    let formData = new FormData(myForm);
    let object = {};
    formData.forEach((value, key) => {
        key = key.replace('config_settings_', '');
        if (key === 'enable_script' || key === 'enable_auto_deploy'){
            value = value === 'true' ? '1' : '0';
        }
        object[key] = value;
    });
    let json = JSON.stringify(object);
    sentConfigData(json)
        .then(data => {
            Swal.fire({
                title: '成功',
                text: '配置文件已更新',
                icon: 'success',
                confirmButtonText: '确认'
            });
            loadConfigData(data.data);
        })
        .catch(error => {
            console.error('Error fetching config:', error);
            Swal.fire({
                title: '错误',
                text: '配置文件更新失败，错误信息：' + error,
                icon: 'error',
                confirmButtonText: '确认'
            });
        });
}

async function sentConfigData(json) {
    const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: json
    });
    return response.json();
}

async function getConfigData() {
    const response = await fetch('/api/config');
    return response.json();
}

async function loadConfigData(data=null) {
    let button_to_hide = document.getElementById('config_settings_submit');
    button_to_hide.style.display = 'none';

    data = data || await getConfigData();
    for (let key in data) {
        if (data.hasOwnProperty(key)) {
            try {
                let element = document.getElementById('config_settings_' + key);
                element.value = data[key];
            } catch (e) {
                if (e instanceof TypeError) {
                    if (key === 'count_by'){
                        let element = document.getElementById('config_settings_count_by_'+data[key]);
                        element.checked = true;
                    }
                    if (key === 'enable_script'){
                        let boolen_value = data[key] === '1' ? true : false;
                        let str_value = boolen_value ? 'true' : 'false';
                        let element = document.getElementById('config_settings_enable_script_'+str_value);
                        element.checked = true;
                    }
                    if (key === 'enable_auto_deploy'){
                        let boolen_value = data[key] === '1' ? true : false;
                        let str_value = boolen_value ? 'true' : 'false';
                        let element = document.getElementById('config_settings_enable_auto_deploy_'+str_value);
                        element.checked = true;
                    }
                }else{
                    console.error(e);
                }
            }
        }
    }
    button_to_hide.style.display = 'block';
}