const urldb = require("../config/urldb.json");
const Sequelize = require("sequelize");
const sequelize = new Sequelize(urldb);
const jwt = require("jsonwebtoken");
const firma = require("../config/firma.json");
const moment = require("moment");

function getProductos(req, res) {
    sequelize
        .query(`SELECT * FROM productos WHERE disponible=1`, {
            type: sequelize.QueryTypes.SELECT,
        })
        //// FALTA CALCULAR FAVORITOS ////////////////////
        .then((respuesta) => {
            res.status(200).json(respuesta);
        })
        .catch((error) => {
            console.log("salió por el cath del controller");
            res.status(500).send();
        });
}

function postUsuario(req, res) {
    usuarioNuevo = req.body;
    usuarioNuevo.idRol = 1;
    sequelize
        .query(
            `INSERT INTO usuarios (idRol, usuario, password, mail, nombre, apellido, telefono, direccion) VALUES
    (:idRol, :usuario, :password, :mail, :nombre, :apellido, :telefono, :direccion)`,
            { replacements: usuarioNuevo }
        )
        .then((respuesta) => {
            res.status(201).send("usuario creado con éxito");
        })
        .catch((error) => {
            console.log("salió por el cath del controller " + error);
            res.status(500).send("Usuario o mail no disponibles");
        });
}

function darDeBajaUsuario(req, res) {
    usuarioDeBaja = req.id;
    sequelize
        .query(`UPDATE usuarios SET idRol=5 WHERE id=${usuarioDeBaja}`)
        .then((respuesta) => {
            res.status(200).send("usuario desactivado con éxito");
        })
        .catch((error) => {
            console.log("salió por el cath del controller " + error);
            res.status(500).send();
        });
}

function login(req, res) {
    const entrante = req.body;
    sequelize
        .query(`SELECT * FROM usuarios WHERE usuario=? OR mail=?`, {
            replacements: [entrante.usuario, entrante.mail],
            type: sequelize.QueryTypes.SELECT,
        })
        .then((encontrado) => {
            if (encontrado[0].idRol === 5) {
                res.status(401).send("usuario inactivo");
            } else if (encontrado[0].password === entrante.password) {
                let contenido = {
                    id: encontrado[0].id,
                    idRol: encontrado[0].idRol,
                };
                let token = jwt.sign(contenido, firma, {
                    expiresIn: "2 hours",
                });
                let respuesta = { token: token };
                res.status(200).json(respuesta);
            } else {
                res.status(401).send("password incorrecta");
            }
        })
        .catch((error) => {
            console.log("salió por el cath del controller " + error);
            res.status(404).send("Mail, usuario o password incorrectos.");
        });
}

function postPedido(req, res) {
    let hora = moment().format("YYYY-DD-MM HH:mm:ss");
    let { idFormaDePago, detalles } = req.body;
    sequelize.query("INSERT INTO pedidos (idUsuario, idFormaDePago, idEstado, hora) VALUES (?,?,?,?)",
        { replacements: [req.id, idFormaDePago, 1, hora] }
    ).then((respuesta) => {
        let idPedido = respuesta[0];
        postRenglones(detalles, idPedido)
            .then((precioTotal) => {
                sequelize.query(`UPDATE pedidos SET precioTotal=${precioTotal} WHERE id = ${idPedido}`)
                }).then((terminado)=>{
                    res.status(201).send("Pedido registrado exitosamente");
                })
            .catch((error) => {
                console.log(error);
                res.status(500).send();
            });
    }
    )
}

function postRenglones(detalles, idPedido) {
    return new Promise(function (resolve, reject) {
        let precioTotal = 0;
        detalles.forEach(element => {
            let { idProducto, cantidad } = element;
            calcularPrecioRenglon(idProducto, cantidad)
                .then((precioRenglon) => {
                    precioTotal = precioTotal + precioRenglon;
                    console.log(precioTotal);
                    sequelize.query("INSERT INTO renglones (idPedido, idProducto, cantidad, precioRenglon) VALUES (?,?,?,?)",
                        { replacements: [idPedido, idProducto, cantidad, precioRenglon] }
                    ).then((posteado) => {
                        console.log('insertado el renglón ' + posteado[0]);
                    })
                }).catch((error) => {
                    console.log(error)
                })
        });
        if (precioTotal !== 0) {
            console.log(precioTotal);
            resolve(precioTotal);
        } else {
            reject('no hay suma');
        }
    })
}

function calcularPrecioRenglon(idProducto, cantidad) {
    return new Promise(function (resolve, reject) {
        sequelize.query("SELECT precioUnitario FROM productos WHERE id = ?", {
            replacements: [idProducto],
            type: sequelize.QueryTypes.SELECT,
        })
            .then((respuesta) => {
                if (respuesta.length !== 0) {
                    precioRenglon = respuesta[0].precioUnitario * cantidad;
                    resolve(precioRenglon);
                } else {
                    reject('No hay precio unitario')
                }
            })
            .catch((error) => {
                console.log(error);
            });
    });
}

function sumarTotal (array) {
    let total= 0;
    array.forEach(element =>{
        total = total + element;
    })
    console.log (total);

}

//sumarTotal([2,5,7,9,4,8,45]);
// function postRenglon(objetoRenglon, idPedido) {
//     return new Promise(function (resolve, reject) {
//         const { idProducto, cantidad } = objetoRenglon;
//         let precioRenglon;
//         calcularPrecioRenglon(idProducto, cantidad).then((respuesta) => {
//             precioRenglon = respuesta;
//             sequelize.query("INSERT INTO renglones (idPedido, idProducto, cantidad, precioRenglon) VALUES (?,?,?,?)",
//                 { replacements: [idPedido, idProducto, cantidad, precioRenglon] }
//             )
//                 .then((respuesta) => {
//                     if (respuesta.length !== 0) {
//                         resolve([respuesta, precioRenglon]);
//                     } else {
//                         reject('no se pudo crear el renglon')
//                     }
//                 })
//                 .catch((error) => {
//                     console.log('no se pudo crear el renglon' + error);
//                 });
//         }).catch((error) => {
//             console.log('no se pudo calcular el precio del renglon, renglon no insertado ' + error);
//         });
//     })
// }





// function aVerElCalculo() {
//     let precioRenglon = calcularPrecioRenglon(1, 4)
//         .then((respuesta) => {
//             console.log(respuesta)
//         }).catch((error) => {
//             console.log('salio por el catch de afuera ' + error);
//         })
// }

// aVerElCalculo();

module.exports = {
    getProductos,
    postUsuario,
    darDeBajaUsuario,
    login,
    postPedido,
};
