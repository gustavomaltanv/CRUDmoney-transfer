const express = require('express');
const { Pool } = require('pg');
const connectionString = 'postgres://ljnbpins:bhGJQuvJVjNFaTwtmVYQuzvsvuIIM2Yc@isabelle.db.elephantsql.com/ljnbpins';
const pool = new Pool({
    connectionString: connectionString
});
const app = express();
const port = 3000;
app.use(express.json());

// METODOS ------------------------------------------------------------------
app.get('/users', async (req, res) => {
    // pool.query('SELECT * from users', (err, result) => {
    //     if (err) {
    //         console.error('Erro: ',err);
    //         res.send(`${err}`);
    //     } else {
    //         console.log('Result: ',result.rows[0]);
    //         res.send(result.rows[0]);
    //     }
    // });
    const result = await pool.query('SELECT * from users');
    res.send(`${JSON.stringify(result.rows)}`);
});

app.post('/user', async (req, res) => {
    // pool.query('SELECT * from users', (err, result) => {
    //     if (err) {
    //         console.error('Erro: ',err);
    //         res.send(`${err}`);
    //     } else {
    //         console.log('Result: ',result.rows[0]);
    //         res.send(result.rows[0]);
    //     }
    //     pool.end;
    // });

    // const result = await pool.query('SELECT * from users')
    // res.send(result.rows)
    // pool.end;

    const { name, age, money } = req.body;
    let moneyReceived = money;
    if (money === null || money === undefined) moneyReceived = 0;

    const client = await pool.connect();
    const result = await client.query(`insert into users (name,age,money) values ('${name}',${age}, ${moneyReceived}) returning id,name,age,money`);
    client.release;

    res.send(result);
});

app.delete('/user/:id', async (req, res) => {
    const id = req.params.id;
    const client = await pool.connect();
    const result = await client.query(`delete from users where id = ${id} returning name`);
    client.release;

    res.send(result.rows[0].name);
});

app.put('/user/:id', async (req, res) => {
    const id = req.params.id;
    const { age } = req.body;
    const client = await pool.connect();
    const result = await client.query(`update users set age = ${age} where id = ${id} returning id,name,age`);
    client.release();

    res.send(result.rows);
});

app.post('/transfer', async (req, res) => {
    const { fromUserId, toUserId, amount } = req.body;
    const client = await pool.connect();
    try {
        await client.query(`begin;`);
        await client.query(`update users set money = money - ${amount} where id = ${fromUserId}`);
        await client.query(`update users set money = money + ${amount} where id = ${toUserId}`);
        await client.query(`commit;`);
        res.send(`transferencia de ${amount} bem sucedida`);
    } catch (ex) {
        console.error(`exception na transaction: `, ex);
        await client.query(`rollback;`);
        res.send(`erro: `, ex);
    }
    finally {
        client.release();
        
    }
});
// LISTEN ----------------------------------------------------------------------
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});