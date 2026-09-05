class AppError extends Error {
	public statusCode: number;
	message: string;
	error: any;
	stack: any;

	constructor(statusCode: number, message: string, error?: any, stack = "") {
		super(message);

		this.statusCode = statusCode;
		if (stack) {
			this.stack = stack;
		} else {
			Error.captureStackTrace(this, this.constructor);
		}

		this.message = message;
		this.error = error;
	}
}
export default AppError;
