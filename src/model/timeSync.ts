const { exec } = require("child_process")

export class TimeSync {
    syncTime() {
        return new Promise((resolve,reject) => {
            exec("sudo ntpdate -u time.apple.com", (error, stdout, stderr) => {
                if (error) {
                    console.log(`error: ${error.message}`);
                    reject(0);
                }
                if (stderr) {
                    console.log(`stderr: ${stderr}`);
                    reject(0);
                }
                console.log(`stdout: ${stdout}`);
                resolve(1);
            });
        })
        
    }
}


