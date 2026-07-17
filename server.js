const express = require('express');
const path = require('path');
const mysql = require('mysql2');

const app = express();
const PORT = process.env.PORT || 3000;

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'analisa_db'
});

db.connect((err) => {
    if (err) {
        console.error("Gagal konek ke MySQL:", err);
        return;
    }
    console.log("Berhasil terhubung ke MySQL");
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ===================== GET =====================
app.get('/api/perusahaan', (req, res) => {

    db.query("SELECT * FROM perusahaan ORDER BY no ASC", (err, result) => {

        if (err) {
            console.log(err);
            return res.status(500).json(err);
        }

        res.json(result);

    });

});

// ===================== POST =====================
app.post('/api/perusahaan', (req, res) => {

    const {
        perusahaan,
        wilayah,
        asetOktober,
        asetNovember,
        asetDesember,
        jumlahKantor
    } = req.body;

    const sql = `
        INSERT INTO perusahaan
        (perusahaan,wilayah,asetOktober,asetNovember,asetDesember,jumlahKantor)
        VALUES (?,?,?,?,?,?)
    `;

    db.query(
        sql,
        [
            perusahaan,
            wilayah,
            asetOktober,
            asetNovember,
            asetDesember,
            jumlahKantor
        ],
        (err, result) => {

            if (err) {
                console.log(err);
                return res.status(500).json(err);
            }

            res.json({
                message: "Data berhasil ditambahkan",
                no: result.insertId
            });

        }
    );

});

// ===================== PUT =====================
app.put('/api/perusahaan/:no', (req, res) => {

    const no = req.params.no;

    const {
        perusahaan,
        wilayah,
        asetOktober,
        asetNovember,
        asetDesember,
        jumlahKantor
    } = req.body;

    const sql = `
        UPDATE perusahaan
        SET
            perusahaan=?,
            wilayah=?,
            asetOktober=?,
            asetNovember=?,
            asetDesember=?,
            jumlahKantor=?
        WHERE no=?
    `;

    db.query(
        sql,
        [
            perusahaan,
            wilayah,
            asetOktober,
            asetNovember,
            asetDesember,
            jumlahKantor,
            no
        ],
        (err) => {

            if (err) {
                console.log(err);
                return res.status(500).json(err);
            }

            res.json({
                message: "Data berhasil diupdate"
            });

        }
    );

});

// ===================== DELETE =====================
app.delete('/api/perusahaan/:no', (req, res) => {

    const no = req.params.no;

    db.query(
        "DELETE FROM perusahaan WHERE no=?",
        [no],
        (err) => {

            if (err) {
                console.log(err);
                return res.status(500).json(err);
            }

            res.json({
                message: "Data berhasil dihapus"
            });

        }
    );

});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});