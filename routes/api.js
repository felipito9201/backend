const express = require('express');
const router = express.Router();
const db = require('../db/db');

//Listar consultores
router.get('/consultores', async function (req, res, next) {
    const result = await db.listConsultores();
    if (result) {
        res.json(result);
    } else {
        res.status(500);
        res.json('ERROR');
    }
});

//Informe
router.post('/informe', async function (req, res, next) {
    const usuarios = req.body.usuarios;
    const inicio = req.body.inicio;
    const fin = req.body.fin;

    let result = [];

    let inicioDate = new Date(inicio + '-01');
    let finDate = new Date(fin + '-01');

    inicioDate = new Date(inicioDate.getFullYear(), inicioDate.getMonth() + 1,1);
    finDate = new Date(finDate.getFullYear(), finDate.getMonth() + 1,1);

    try {
        result = await db.getInforme(usuarios, inicioDate, finDate);
        res.json(result);
    } catch (e) {
        res.status(500);
        res.json(e);
    }
});

router.post('/grafico', async function (req, res, next) {
    const usuarios = req.body.usuarios;
    const inicio = req.body.inicio;
    const fin = req.body.fin;

    let result = [];

    let inicioDate = new Date(inicio + '-01');
    let finDate = new Date(fin + '-01');

    inicioDate = new Date(inicioDate.getFullYear(), inicioDate.getMonth() + 1,1)
    finDate = new Date(finDate.getFullYear(), finDate.getMonth() + 1,1)

    try {
        result = await db.getGraficoData(usuarios, inicioDate, finDate);
        res.json(result);
    } catch (e) {
        res.status(500);
        res.json(e);
    }
});

router.post('/pizza', async function (req, res, next) {
    const usuarios = req.body.usuarios;
    const inicio = req.body.inicio;
    const fin = req.body.fin;

    let result = [];

    let inicioDate = new Date(inicio + '-01');
    let finDate = new Date(fin + '-01');

    inicioDate = new Date(inicioDate.getFullYear(), inicioDate.getMonth() + 1,1)
    finDate = new Date(finDate.getFullYear(), finDate.getMonth() + 1,1)

    try {
        result = await db.getPizzaData(usuarios, inicioDate, finDate);
        res.json(result);
    } catch (e) {
        res.status(500);
        res.json(e);
    }
});



module.exports = router;
