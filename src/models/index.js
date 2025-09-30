import * as cuadrosModel from './cuadrosModel.js';
import * as categoriasModel from './categoriasModel.js';
import * as usuariosModel from './usuariosModel.js';

/**
 * Este archivo centraliza la exportación de todos los modelos.
 * Ayuda a prevenir problemas de dependencia circular al importar modelos
 * desde un único punto de entrada.
 *
 * En lugar de: import { func } from './cuadrosModel.js';
 * Usa: import { cuadrosModel } from './models/index.js';
 * Y luego: cuadrosModel.func();
 */

export {
    cuadrosModel,
    categoriasModel,
    usuariosModel
};