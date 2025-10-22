const express = require('express');
const router = express.Router();
const studentsController = require('../controllers/studentsController');

// Rotas de alunos
router.get('/students', studentsController.listStudents);
router.get('/students/stats', studentsController.getStats);
router.get('/students/:id', studentsController.getStudentById);
router.post('/students', studentsController.addStudent);
router.put('/students/:id', studentsController.updateStudent);
router.delete('/students/:id', studentsController.deleteStudent);
router.post('/students/:id/avatar', studentsController.uploadAvatar);

module.exports = router;
