// 以下是個人檔案的圖片
document.getElementById('profile_pic_input').addEventListener('change', function(event) {
    var file = event.target.files[0];
    if (file) {
        var reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('profile_pic_preview').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// 切換區域
const myItemsBtn = document.getElementById('my_items');
const messageBtn = document.getElementById('message');
const updateBtn = document.getElementById('update');

const myItemsDiv = document.querySelector('.my_items');
const messageDiv = document.querySelector('.message');
const updateDiv = document.querySelector('.update');

// 隱藏所有內容區域
function hideAll() {
    myItemsDiv.style.display = 'none';
    messageDiv.style.display = 'none';
    updateDiv.style.display = 'none';
}

// 按下我的商品時，顯示我的商品區
myItemsBtn.addEventListener('click', () => {
    hideAll();
    myItemsDiv.style.display = 'block';
});

// 按下聊天室時，顯示聊天室區
messageBtn.addEventListener('click', () => {
    hideAll();
    messageDiv.style.display = 'block';
});

// 按下我要上架，顯示我要上架區域
updateBtn.addEventListener('click', () => {
    hideAll();
    updateDiv.style.display = 'block';
});

// 初始顯示我的商品區
hideAll(); // 先隱藏所有區域
myItemsDiv.style.display = 'block'; 

// 我的商品欄位
async function fetchSellerProducts() {
    try {
        const response = await fetch(`/api/seller/products`);
        if (!response.ok) {
            throw new Error('網絡請求失敗');
        }
        
        const data = await response.json();
        const products = data.products; // 確認接收的資料格式

        // 選取唯一的 .my_items 容器
        const myItemsDiv = document.querySelector('.my_items');
        myItemsDiv.innerHTML = ''; // 清空現有內容

        let itemRowDiv = null;
        products.forEach((product, index) => {
            if (index % 4 === 0) {
                itemRowDiv = document.createElement('div');
                itemRowDiv.classList.add('itemrow');
                myItemsDiv.appendChild(itemRowDiv);
            }

            const itemDiv = document.createElement('div');
            itemDiv.classList.add('item');

            itemDiv.innerHTML = `
                <img src="${product.image_url}" alt="${product.name}" />
                <h3>${product.name}</h3>
                <p>價格: ${product.price}</p>
                <p>新舊狀況: ${product.condition}</p>
                <button data-product-id="${product.product_id}">編輯</button>
            `;

            itemRowDiv.appendChild(itemDiv);
        });

        // 事件代理，註冊編輯按鈕事件
        const buttons = myItemsDiv.querySelectorAll('button');
        buttons.forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.getAttribute('data-product-id');
                editProduct(productId);  // 假設 editProduct 是已定義的函數
            });
        });

    } catch (error) {
        console.error('抓取商品資料失敗:', error);
        alert('前端無法載入商品資料，請稍後再試');
    }
}



// 在頁面加載時執行 fetchSellerProducts 函數
document.addEventListener('DOMContentLoaded', () => {
    fetchSellerProducts();
});


function editProduct(productId) {
    // 編輯商品邏輯
    console.log(`編輯商品 ID: ${productId}`);
    // 你可以在這裡顯示一個編輯表單，或跳轉到編輯頁面等
}

fetchSellerProducts(); // 當頁面加載時調用

// 上架商品
document.querySelector('.update button').addEventListener('click', function(event) {
    event.preventDefault(); // 防止默認表單提交

    const form = document.getElementById('product-form');
    const formData = new FormData(form);
    const userType = sessionStorage.getItem('userType');

    // 收集表單數據
    const fData = {
        name: formData.get('name'),
        category: formData.get('category'),
        price: formData.get('price'),
        condition: formData.get('condition'),
        imageUrl: formData.get('imageUrl'),
        description: formData.get('description'),
        quantity: formData.get('quantity')
    };

    if (!fData.name || !fData.price || !fData.category || !fData.condition) {
        alert('請確保所有必填欄位都已填寫');
        return;
    }

    alert(
        `商品名稱: ${fData.name}\n` +
        `商品類別: ${fData.category}\n` +
        `價格: ${fData.price}\n` +
        `商品狀況: ${fData.condition}\n` +
        `圖片網址: ${fData.imageUrl}\n` +
        `描述: ${fData.description}\n` +
        `數量: ${fData.quantity}`
    );

    // 提交資料到伺服器
    fetch('/api/seller/products', {
        method: 'POST',
        /*
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(fData),
        */
        body: formData
    })
    .then(response => response.json())
    .then(fData => {
        if (fData.success) {
            alert('商品上架成功');
            form.reset();   // 清空表單
        } else {
            alert(fData.message || '上架失敗');
        }
    })
    .catch(error => {
        console.error('錯誤:', error);
        alert('seller_index商品上架失敗，請稍後再試');
    });
});


