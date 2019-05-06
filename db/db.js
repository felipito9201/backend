const Sequelize = require('sequelize');

const sequelize = new Sequelize('caol', 'root', 'root', {
    host: 'localhost',
    dialect: 'mysql'
});

//consulta los consultores
module.exports.listConsultores = () => {
    const sql = 'SELECT u.co_usuario AS usuario, u.no_usuario AS nombre FROM cao_usuario u ' +
        'INNER JOIN permissao_sistema p ON u.co_usuario = p.co_usuario ' +
        'WHERE p.co_sistema = 1 AND p.in_ativo = \'S\' AND p.co_tipo_usuario IN ( 0, 1, 2 )'

    return sequelize.query(sql, {type: sequelize.QueryTypes.SELECT});
};

//devuelve los datos del informe
module.exports.getInforme = async (usuarios, inicio, fin) => {
    const sql = 'SELECT ' +
        'IFNULL( SUM( f.valor - f.valor * ( f.total_imp_inc / 100 ) ), 0 ) AS ganacia, ' +
        'IFNULL( SUM( ( f.valor - f.valor * ( f.total_imp_inc / 100 ) ) * ( f.comissao_cn / 100 ) ), 0 ) AS comision ' +
        'FROM ' +
        'cao_fatura f ' +
        'INNER JOIN cao_os o ON f.co_os = o.co_os ' +
        'INNER JOIN cao_salario s ON o.co_usuario = s.co_usuario ' +
        'INNER JOIN cao_usuario u ON o.co_usuario = u.co_usuario ' +
        'WHERE ' +
        'u.co_usuario = ? ' +
        'AND f.data_emissao >= ? AND f.data_emissao < ?';

    const sqlCosto = 'SELECT ' +
        's.brut_salario AS costo ' +
        'FROM ' +
        'cao_salario s ' +
        'WHERE s.co_usuario = ?';

    let result = [];

    // se obtienen los rangos de las fechas
    const rangos = getRangos(inicio, fin);

    //recorre el arreglo de usuarios para obtener sus datos
    for (const usuario of usuarios) {

        let informes = [];
        let costo = 0;

        const rowsCosto = await sequelize.query(sqlCosto, {
            replacements: [usuario],
            type: sequelize.QueryTypes.SELECT
        });

        if (rowsCosto.length === 1){
            costo = rowsCosto[0].costo;
        }

        // se busca el informe para cada rango de fecha
        for (const rango of rangos) {
            const fecha = rango.inicio.getFullYear() + '-' + String(rango.inicio.getMonth() + 1).padStart(2,'0');
            const rows = await sequelize.query(sql, {
                replacements: [usuario, rango.inicio, rango.fin],
                type: sequelize.QueryTypes.SELECT
            });

            // se comprueba si el resultado es valido
            if (rows !== null) {
                // se guarda el resultado
                informes.push({fecha: fecha, ganacia: rows[0].ganacia, comision: rows[0].comision, costo: costo});
            }
        }

        //obtiene el nombre
        const name = await sequelize.query('SELECT no_usuario as nombre FROM cao_usuario WHERE co_usuario = ?', {
            replacements: [usuario],
            type: sequelize.QueryTypes.SELECT
        });
        result.push({nombre: name[0].nombre, informes: informes});
    }

    return result;
};

//devuelve los datos del grafico
module.exports.getGraficoData = async (usuarios, inicio, fin) => {
    const sqlGanancia = 'SELECT ' +
        'IFNULL( SUM( f.valor - f.valor * ( f.total_imp_inc / 100 )), 0 ) AS ganancia ' +
        'FROM ' +
        'cao_fatura f ' +
        'INNER JOIN cao_os o ON f.co_os = o.co_os ' +
        'INNER JOIN cao_usuario u ON o.co_usuario = u.co_usuario ' +
        'WHERE ' +
        'u.co_usuario = ? ' +
        'AND f.data_emissao >= ? AND f.data_emissao < ?';

    const sqlPromedio = 'SELECT ' +
        'IFNULL( SUM( s.brut_salario ) / COUNT( * ), 0 ) AS promedio ' +
        'FROM ' +
        'cao_salario s ' +
        'WHERE ' +
        's.co_usuario IN (?)';

    //se crea la estructura del resultado
    let result = {promedio: 0, ganancias: []};

    //se obtiene el promedio
    const promedio = await sequelize.query(sqlPromedio, {
        replacements: [usuarios],
        type: sequelize.QueryTypes.SELECT
    });

    result.promedio = promedio[0].promedio;

    //se obtienen las ganancias para cada usuario
    for (const usuario of usuarios) {
        let ganancia = 0;
        const rows = await sequelize.query(sqlGanancia, {
            replacements: [usuario, inicio, fin],
            type: sequelize.QueryTypes.SELECT
        });

        const name = await sequelize.query('SELECT no_usuario as nombre FROM cao_usuario WHERE co_usuario = ?', {
            replacements: [usuario],
            type: sequelize.QueryTypes.SELECT
        });

        if (rows.length === 1) {
            ganancia = rows[0].ganancia;
        }

        result.ganancias.push({nombre: name[0].nombre, ganancia: ganancia});
    }

    return result;
};

//devuelve los datos de pizza
module.exports.getPizzaData = async (usuarios, inicio, fin) => {
    const sqlGanancia = 'SELECT ' +
        'IFNULL( SUM( f.valor - f.valor * ( f.total_imp_inc / 100 )), 0 ) AS ganancia ' +
        'FROM ' +
        'cao_fatura f ' +
        'INNER JOIN cao_os o ON f.co_os = o.co_os ' +
        'INNER JOIN cao_usuario u ON o.co_usuario = u.co_usuario ' +
        'WHERE ' +
        'u.co_usuario = ? ' +
        'AND f.data_emissao >= ? AND f.data_emissao < ?';

    const sqlTotal = 'SELECT ' +
        'IFNULL( SUM( f.valor - f.valor * ( f.total_imp_inc / 100 ) ), 0 ) AS total ' +
        'FROM ' +
        'cao_fatura f ' +
        'INNER JOIN cao_os o ON f.co_os = o.co_os ' +
        'WHERE ' +
        'o.co_usuario IN (?) ' +
        'AND f.data_emissao >= ? AND f.data_emissao < ?';

    let result = [];

    //se obtiene el total
    const total = await sequelize.query(sqlTotal, {
        replacements: [usuarios, inicio, fin],
        type: sequelize.QueryTypes.SELECT
    });

    //se obtienen los porcientos para cada usuario
    for (const usuario of usuarios) {
        const rows = await sequelize.query(sqlGanancia, {
            replacements: [usuario, inicio, fin],
            type: sequelize.QueryTypes.SELECT
        });
        if (rows != null) {
            const name = await sequelize.query('SELECT no_usuario as nombre FROM cao_usuario WHERE co_usuario = ?', {
                replacements: [usuario],
                type: sequelize.QueryTypes.SELECT
            });

            const porciento = (rows[0].ganancia * 100) / total[0].total;
            result.push({nombre: name[0].nombre, porciento: porciento});
        }
    }

    return result;
};

function getRangos(inicio, fin) {
    let result = [];

    if (inicio.getFullYear() === fin.getFullYear() && inicio.getMonth() === fin.getMonth()) {
        result.push({inicio, fin});
        return result;
    }

    while (inicio.getTime() < fin.getTime()) {
        let temp = null;

        if (inicio.getMonth() === 11) {
            temp = new Date(inicio.getFullYear() + 1, 0, 1);
        } else {
            temp = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 1);
        }

        result.push({inicio, fin: temp});

        inicio = temp;
    }

    return result;
}
