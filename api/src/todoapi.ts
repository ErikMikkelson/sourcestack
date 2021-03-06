import express from 'express';
import RestypedRouter from 'restyped-express-async';
import { TodoApi } from "./todoapitypes";
import { Todo } from "./todo";
import { TodoDao } from './tododao';

export function createTodoApi(app: express.Express){

    let router = RestypedRouter<TodoApi>(app);
    
    router.get('/api/private/todos', async (req, _) => {
        let result = await TodoDao.primaryKey.query({hash: req.user.userId as string});
        return result.records.map(t => t.serialize() as Todo);
    });

    router.post('/api/private/todo', async (req, _) => {
        let todo = new TodoDao();
        todo.userId = req.user.userId as string;
        todo.taskId = new Date().getTime();
        todo.title = req.body.title;
        await todo.save();
        return todo;
    });

    router.delete('/api/private/todo', async (req, res) => {
        await TodoDao.primaryKey.delete(req.user.userId as string, parseInt(req.query.id));
    });

    router.get('/api/ping', async (req, res) => {
        return 'pong';
    });

    router.get('/api/private/ping', async (req, _) => {
        return 'pong ' + req.user.userId;
    });


}