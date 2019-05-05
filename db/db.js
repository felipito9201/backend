const Sequelize = require('sequelize');

const sequelize = new Sequelize('caol', 'root', '', {
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
        'CONCAT( YEAR ( f.data_emissao ), "-", LPAD( MONTH ( f.data_emissao ), 2, "0" ) ) AS fecha, ' +
        'IFNULL( SUM( f.valor - f.valor * ( f.total_imp_inc / 100 ) ), 0 ) AS ganacia, ' +
        'IFNULL( SUM( ( f.valor - f.valor * ( f.total_imp_inc / 100 ) ) * ( f.comissao_cn / 100 ) ), 0 ) AS comision, ' +
        'IFNULL( s.brut_salario, 0 ) AS costo ' +
        'FROM ' +
        'cao_fatura f ' +
        'INNER JOIN cao_os o ON f.co_os = o.co_os ' +
        'INNER JOIN cao_salario s ON o.co_usuario = s.co_usuario ' +
        'INNER JOIN cao_usuario u ON o.co_usuario = u.co_usuario ' +
        'WHERE ' +
        'u.co_usuario = ? ' +
        'AND f.data_emissao BETWEEN ? AND ? ' +
        'GROUP BY ' +
        'CONCAT( YEAR ( f.data_emissao ), "-", LPAD( MONTH ( f.data_emissao ), 2, "0" ) ) ' +
        'ORDER BY ' +
        'CONCAT( YEAR ( f.data_emissao ), "-", LPAD( MONTH ( f.data_emissao ), 2, "0" ) )';

    let result = [];

    //recorre el arreglo de usuarios para obtener sus datos
    for (const usuario of usuarios) {
        const rows = await sequelize.query(sql, {
            replacements: [usuario, inicio, fin],
            type: sequelize.QueryTypes.SELECT
        });
        if (rows != null) {
            //obtiene el nombre
            const name = await sequelize.query('SELECT no_usuario as nombre FROM cao_usuario WHERE co_usuario = ?', {
                replacements: [usuario],
                type: sequelize.QueryTypes.SELECT
            });
            result.push({nombre: name[0].nombre, informes: rows});
        }
    }

    return result;
};

//devuelve los datos del grafico
module.exports.getGraficoData = async (usuarios, inicio, fin) => {
    const sqlGanancia = 'SELECT ' +
        'u.no_usuario AS nombre, ' +
        'IFNULL( SUM( f.valor - f.valor * ( f.total_imp_inc / 100 )), 0 ) AS ganancia ' +
        'FROM ' +
        'cao_fatura f ' +
        'INNER JOIN cao_os o ON f.co_os = o.co_os ' +
        'INNER JOIN cao_usuario u ON o.co_usuario = u.co_usuario ' +
        'WHERE ' +
        'u.co_usuario = ? ' +
        'AND f.data_emissao BETWEEN ? AND ?';

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
        const rows = await sequelize.query(sqlGanancia, {
            replacements: [usuario, inicio, fin],
            type: sequelize.QueryTypes.SELECT
        });
        if (rows != null) {
            result.ganancias.push(rows[0]);
        }
    }

    return result;
};

//devuelve los datos de pizza
module.exports.getPizzaData = async (usuarios, inicio, fin) => {
    const sqlGanancia = 'SELECT ' +
        'u.no_usuario AS nombre, ' +
        'IFNULL( SUM( f.valor - f.valor * ( f.total_imp_inc / 100 )), 0 ) AS ganancia ' +
        'FROM ' +
        'cao_fatura f ' +
        'INNER JOIN cao_os o ON f.co_os = o.co_os ' +
        'INNER JOIN cao_usuario u ON o.co_usuario = u.co_usuario ' +
        'WHERE ' +
        'u.co_usuario = ? ' +
        'AND f.data_emissao BETWEEN ? AND ?';

    const sqlTotal = 'SELECT ' +
        'IFNULL( SUM( f.valor - f.valor * ( f.total_imp_inc / 100 ) ), 0 ) AS total ' +
        'FROM ' +
        'cao_fatura f ' +
        'INNER JOIN cao_os o ON f.co_os = o.co_os ' +
        'WHERE ' +
        'o.co_usuario IN (?) ' +
        'AND f.data_emissao BETWEEN ? AND ?';

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
            const porciento = (rows[0].ganancia * 100) / total[0].total;
            result.push({nombre: rows[0].nombre, porciento: porciento});
        }
    }

    return result;
};
