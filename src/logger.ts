// Packages
import "colors";

export class Logger {
	constructor() {}

	info(name: string, ...message: any) {
		console.log(`${"[INFO]".red} [${name.green}] => `, ...message);
	}

	debug(name: string, ...message: any) {
		console.log(`${"[DEBUG]".green} [${name.green}] => `, ...message);
	}

	error(name: string, ...message: any) {
		console.log(`${"[ERROR]".red} [${name.green}] => `, ...message);
	}

	success(name: string, ...message: any) {
		console.log(`${"[SUCCESS]".green} [${name.green}] => `, ...message);
	}
}

