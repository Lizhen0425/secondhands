let login = document.getElementById("login");
let register = document.getElementById("register");
let form_box = document.getElementsByClassName("form-box")[0];
let register_box = document.getElementsByClassName("sign-box")[0];
let login_box = document.getElementsByClassName("login-box")[0];

document.querySelector("#phone-version #register-button").addEventListener("click", function() {
    document.querySelector("#phone-version .login-box").style.display = "none"; 
    document.querySelector("#phone-version .sign-box").style.display = "block"; 
});

document.querySelector("#phone-version #register-phone").addEventListener("click", function() {
    document.querySelector("#phone-version .sign-box").style.display = "none";   
    document.querySelector("#phone-version .login-box").style.display = "block"; 
});


document.addEventListener("DOMContentLoaded", function() {
    const spaceSelect = document.getElementById("space");
    const otherLocationInput = document.getElementById("other-location");

    spaceSelect.addEventListener("change", function() {
        if (spaceSelect.value === "其他") {
            otherLocationInput.hidden = false; // 顯示其他地點輸入框
        } else {
            otherLocationInput.hidden = true; // 隱藏其他地點輸入框
            otherLocationInput.value = ""; // 清空輸入框內容
        }
    });
});

// 切換到註冊表單
register.addEventListener('click', () => {
    form_box.style.transform = 'translateX(80%)';
    login_box.classList.add('hidden');
    register_box.classList.remove('hidden');
});

// 切換到登入表單
login.addEventListener('click', () => {
    form_box.style.transform = 'translateX(0%)';
    register_box.classList.add('hidden');
    login_box.classList.remove('hidden');
});

// 處理註冊表單
document.querySelector('.sign-box button').addEventListener('click', (event) => {
    event.preventDefault();

    const name = document.querySelector('input[name="name"]').value;
    const studentId = document.querySelector('input[name="student_id"]').value;
    const email = document.querySelector('input[name="email"]').value;
    const password = document.querySelector('input[name="password"]').value;

    // 檢查是否有空的欄位
    if (!name || !studentId || !email || !password) {
        alert("請填寫所有欄位");
        return;
    }

    // 構建表單資料
    const formData = {
        name: name,
        student_id: studentId,
        email: email,
        password: password,
    };

    // 使用 fetch 發送請求到伺服器
    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('註冊成功');
        } else {
            alert(data.message || '註冊失敗');
        }
    })
    .catch(error => {
        console.error('註冊失敗:', error);
        alert('請稍後再試');
    });
});

// 處理登入表單
document.querySelector('.login-form button').addEventListener('click', (event) => {
    event.preventDefault();
    const password = document.querySelector('#password').value;
    const username = document.querySelector('#username').value;
    // console.log(`帳號: ${username}, 密碼: ${password}`);

    if (!username || !password) {
        alert("請填寫所有欄位");
        return;
    }
    //alert(`帳號: ${username}, 密碼: ${password}`);
    const userType = sessionStorage.getItem('userType');
    //alert(`帳號: ${username}, 密碼: ${password}, 身份: ${userType}`);

    const loginData = new URLSearchParams();  
    loginData.append('username', username);     
    loginData.append('password', password);     
    loginData.append('userType', userType); 

    // 登入請求
    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: loginData
    }).then(response => response.json())
    .then(data => {
        if (data.success) {
            //alert('登入成功');
            // 根據 userType 跳轉到相應的頁面
            if (userType === 'buyer') {
                window.location.href = '/buyer_index.html';   // 買家頁面
            } else if (userType === 'seller') {
                window.location.href = '/seller_index.html'; // 賣家頁面
            } else {
                alert('請選擇身份');
            }
        } else {
            alert(data.message || '登入失敗');
        }
    }).catch(error => {
        console.error('登入失敗:', error);
        alert('請稍後再試');
    });
});
