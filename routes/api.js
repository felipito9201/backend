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

    const inicioDate = new Date(inicio + '-1');
    let temp = new Date(fin + '-1');
    let mesSiguiente = new Date(temp.setMonth(temp.getMonth() + 1));
    const finDate = new Date(mesSiguiente.setDate(mesSiguiente.getDate() - 1));

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

    const inicioDate = new Date(inicio + '-1');
    let temp = new Date(fin + '-1');
    let mesSiguiente = new Date(temp.setMonth(temp.getMonth() + 1));
    const finDate = new Date(mesSiguiente.setDate(mesSiguiente.getDate() - 1));

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

    const inicioDate = new Date(inicio + '-1');
    let temp = new Date(fin + '-1');
    let mesSiguiente = new Date(temp.setMonth(temp.getMonth() + 1));
    const finDate = new Date(mesSiguiente.setDate(mesSiguiente.getDate() - 1));

    try {
        result = await db.getPizzaData(usuarios, inicioDate, finDate);
        res.json(result);
    } catch (e) {
        res.status(500);
        res.json(e);
    }
});

module.exports = router;
