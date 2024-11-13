const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const path = require('path');
const mysql = require('mysql2/promise');
const app = express();
const port = 5501;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 提供靜態資源
app.use(express.static(path.join(__dirname, 'register')));
app.use(express.static(path.join(__dirname, 'buyer_index')));
app.use(express.static(path.join(__dirname, 'seller_index')));
app.use(express.static(path.join(__dirname, 'index')));

// 首頁
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index' ,'index.html'));
});

// 註冊頁面
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register', 'register.html'));
});

// 買家頁面
app.get('/buyer_index', (req, res) => {
    res.sendFile(path.join(__dirname, 'buyer_index', 'buyer_index.html'));
});

// 賣家頁面
app.get('/seller_index', (req, res) => {
    res.sendFile(path.join(__dirname, 'seller_index', 'seller_index.html'));
});

// 設置 PostgreSQL 連接配置
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'secondhand market',
    password: '123456',
    port: 5432,
});

// 設置 MySQL 連接配置
const mysqlPool = mysql.createPool({
    host: 'localhost',
    user: 'root',           // MySQL 用戶名
    password: 's8972831', // MySQL 密碼
    database: 'second_hand_data', // 資料庫名稱
    connectionLimit: 10      // 連接池大小
});

// 連接postgre資料庫
pool.connect((err) => {
    if (err) {
        console.error('postgre資料庫連接錯誤: ' + err.stack);
        return;
    }
    console.log('已成功連接到postgre資料庫');
});

// 連接mysql資料庫
mysqlPool.getConnection((err) => {
    if (err) {
        console.error('mysql資料庫連接錯誤: ' + err.stack);
        return;
    }
    console.log('已成功連接到mysql資料庫');
});

// 註冊路由
app.post('/register', async (req, res) => {
    const { name, student_id, email, password } = req.body;

    if (!name || !student_id || !email || !password) {
        return res.json({ success: false, message: '請填寫所有欄位' });
    }

    // 加密密碼
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const query = 'INSERT INTO users (name, student_id, email, password) VALUES ($1, $2, $3, $4)';
        await pool.query(query, [name, student_id, email, hashedPassword]); // 存入哈希密碼
        res.json({ success: true, message: '註冊成功' });
    } catch (error) {
        console.error('資料庫操作錯誤: ', error);
        res.json({ success: false, message: '註冊失敗，稍後再試' });
    }
});

const session = require('express-session');

// 設置 session
app.use(session({
    secret: 'your-secret-key',  // 用來加密 session
    //secret: '',  
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }   // 在開發中可以使用 secure: false
}));

// 登入路由 
let sellerId = null;
app.post('/login', (req, res) => {
    const { username, password, userType } = req.body; // 從請求中獲取 userType

    console.log(`收到的登入資料：帳號: ${username}, 密碼: ${password}, 身份: ${userType}`); // debug
    // 檢查必填欄位
    if (!username || !password) {
        return res.json({ success: false, message: '請填寫帳號與密碼' });
    }

    // 檢查帳號是 email 還是 student_id
    const query = isNaN(username)
        ? 'SELECT * FROM users WHERE email = $1'
        : 'SELECT * FROM users WHERE student_id = $1';

    // 只傳遞一個參數
    pool.query(query, [username], (err, results) => {
        if (err) {
            console.error('資料庫查詢失敗:', err);
            return res.status(500).json({ success: false, message: '登入過程中出現錯誤，請稍後再試' });
        }

        // 檢查結果是否存在
        if (results.rows.length === 0) {
            return res.json({ success: false, message: '帳號不存在' });
        }

        const user = results.rows[0];

        // 比對密碼
        bcrypt.compare(password, user.password, (err, result) => {
            if (err) {
                console.error('密碼比對錯誤:', err);
                return res.json({ success: false, message: '登入失敗，請稍後再試' });
            }

            if (result) {
                req.session.sellerId = user.id;  // 假設 `user.id` 是 seller 的 ID
                console.log('設置後的 session sellerId:', req.session.sellerId);
                // 根據 userType 返回不同的 URL 給前端
                if (userType === 'buyer') {
                    res.json({ success: true, redirectUrl: '/buyer_index.html' });
                } else if (userType === 'seller') {
                    res.json({ success: true, redirectUrl: '/seller_index.html' });
                } else {
                    res.json({ success: true, message: '登入成功，但沒有選擇身份' });
                }
            } else {
                res.json({ success: false, message: '帳號或密碼錯誤' });
            }
        });
    });
});

// 從資料庫抓商品資料
app.get('/api/seller/products', async (req, res) => {
    console.log('收到 /api/seller/products 請求');
    const sellerId = req.session.sellerId; // 使用賣家 ID 查詢

    if (!sellerId) {
        return res.status(400).json({ error: '缺少賣家 ID' });
    }
    else{
        console.log('sellerId:', sellerId);
    }

    try {
        // 使用 await 語法進行查詢
        const [results] = await mysqlPool.query(
            'SELECT * FROM products WHERE seller_id = ?',
            [sellerId]
        );

        // 顯示查詢到的商品資料
        console.log('查詢到的商品資料:', results);

        // 回傳商品資料給前端
        res.json({ products: results });
    } catch (err) {
        console.error('MySQL 查詢錯誤:', err);
        res.status(500).json({ error: '查詢商品資料失敗' });
    }
});


// 商品上架路由
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // 上傳圖片儲存到 uploads 資料夾

app.post('/api/seller/products', upload.single('image'), async (req, res) => {
    // 從 request body 中獲取商品資料
    const { name, category, price, condition, description, quantity } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : ''; // 獲取圖片路徑
    const sellerId = req.session.sellerId; // 從 session 中獲取賣家 ID

    if (!sellerId) {
        return res.status(400).json({ success: false, message: '無效的賣家 ID，請重新登入' });
    }

    console.log("接收的商品資料:", req.body);
    console.log("圖片路徑:", imageUrl);

    // 檢查必填欄位
    if (!name || !price || !category || !condition || !quantity) {
        return res.status(400).json({ success: false, message: '請填寫所有必填欄位' });
    }

    // debug顯示將存入的商品內容
    console.log("即將存入資料庫的商品內容:");
    console.log(`賣家ID: ${sellerId}`);
    console.log(`商品名稱: ${name}`);
    console.log(`商品類別: ${category}`);
    console.log(`價格: ${price}`);
    console.log(`商品狀況: ${condition}`);
    console.log(`圖片URL: ${imageUrl}`);
    console.log(`描述: ${description}`);
    console.log(`數量: ${quantity}`);

    try {
        // 修改 SQL 查詢語法，使用反引號處理 condition 欄位
        const query = `
            INSERT INTO products (seller_id, name, category, price, \`condition\`, image_url, description, quantity)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        // 使用 mysql2 的 promise 方式執行查詢
        await mysqlPool.query(query, [sellerId, name, category, price, condition, imageUrl, description, quantity]);

        // 回應成功訊息
        res.json({ success: true, message: '商品上架成功' });
    } catch (error) {
        console.error('MySQL資料庫操作錯誤:', error);
        res.status(500).json({ success: false, message: 'server端商品上架失敗，請稍後再試' });
    }
});


// 啟動伺服器
app.listen(port, () => {
    console.log(`伺服器已啟動(http://localhost:${port})`);
});

// app.listen(port, '0.0.0.0', () => {
//     console.log(`伺服器已啟動(http://0.0.0.0:${port})`);
// });
