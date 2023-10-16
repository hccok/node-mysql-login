/* 引入express框架 */
const express = require('express');
const app = express();
/* 引入cors */
const cors = require('cors');
app.use(cors());
/* 引入body-parser */
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const jwt = require("jsonwebtoken")

const mysql = require("mysql")


const conn = mysql.createConnection({
	host: "127.0.0.1",
	user: "root",
	password: "123456",
    //此处是你添加的数据库名
	database: "test_9_25",
	multipleStatements: true,
})


app.all('*', function (req, res, next) {
  if (!req.get('Origin')) return next();
  // use "*" here to accept any origin
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET');
  res.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
  // res.set('Access-Control-Allow-Max-Age', 3600);
  if ('OPTIONS' == req.method) return res.send(200);
  next();
});
app.get('/', (req, res) => {
  res.send('<p style="color:red">服务已启动</p>');
})
app.get('/api/list', (req, res) => {
    console.log(req);
  res.json({
    code: 200,
    message: '成功',
    data: {
      list: [req]
    }
  });
})
app.post('/api/post', (req, res) => {
  res.json({
    code: 200,
    message: '成功',
    data: {
      list: [
        {id:"1"},
        {id:"2"}
      ]
    }
  });
})

//post请求
app.post("/api/register", (req, res) => {
    // console.log(req.body);
	var userName = req.body.data.username
	var passWord = req.body.data.password
    // console.log(userName);
    // console.log(passWord);
	if (!userName || !passWord) {
		res.send({
			code: 0,
			msg: "用户名与密码为必传参数...",
		})
		return
	}
	if (userName && passWord) {
		const result = `SELECT * FROM bobby WHERE name = '${userName}'`
		conn.query(result, [userName], (err, results) => {
			console.log(result);
 			if (err) throw err
			console.log(results);
			if (results.length >= 1) {
				res.send({ code: 0, msg: "注册失败，用户名重复" })
			} else {
				const sqlStr = "insert into bobby(name,password) values(?,md5(?))"
				conn.query(sqlStr, [userName, passWord], (err, results) => {
					if (err) throw err
					if (results.affectedRows === 1) {
						res.send({ code: 1, msg: "注册成功" })
					} else {
						res.send({ code: 0, msg: "注册失败" })
					}
				})
			} 
		})
	}
 
	console.log("接收", req.body.data)
})

app.post("/api/login", (req, res) => {
	var userName = req.body.data.username
	var passWord = req.body.data.password
	if (!userName || !passWord) {
		res.send({
			code: 0,
			msg: "用户名与密码为必传参数...",
		})
		return
	}
	const sqlStr = "select * from bobby WHERE name=? AND passWord=?"
	conn.query(sqlStr, [userName, passWord], (err, result) => {
		if (err) throw err
		if (result.length > 0) {
			// 生成token
			var token = jwt.sign(
				{
					identity: result[0].identity,
					userName: result[0].userName,
				},
				"secret",
				{ expiresIn: "1h" },
			)
			console.log(token)
			res.send({ code: 1, msg: "登录成功", token: token })
 
			// 如果没有登录成功，则返回登录失败
		} else {
			// 判断token
			if (req.headers.authorization == undefined || req.headers.authorization == null) {
				if (req.headers.authorization) {
					var token = req.headers.authorization.split(" ")[1] // 获取token
				}
				jwt.verify(token, "secret", (err, decode) => {
					if (err) {
						res.send({ code: 0, msg: "登录失败" })
					}
				})
			}
		}
	})
})


/* 监听端口 */
app.listen(3000, () => {
  console.log('listen:3000');
})