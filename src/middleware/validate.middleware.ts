import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validate = (schema: AnyZodObject) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            schema.parse(req.body);
            next();
        } catch (err) {
            if (err instanceof ZodError) {
                res.status(400).json({
                    reqBody: req.body,
                    reqQuery: req.query,
                    reqParams: req.params,
                    success: false,
                    errors: err.errors,
                });
                return
            }
            next(err);
        }
    };
};