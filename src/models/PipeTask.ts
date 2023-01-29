import moment = require("moment");
import type PipeWorks from "./PipeWorks";

interface OutputWithStatus {
    status?: boolean
}

interface InputWithPreviousInputs {
    last: OutputWithStatus[]
}


function OnLog(args: any) {
    let log = moment(new Date()).format("DD/MM/YYYY hh:mm:ss") + ' ';
    args.forEach(str => {
        if (['number', 'string', 'boolean'].indexOf(typeof str) > -1) {
            log = log.concat(str).concat(' ')
        }
        else {
            log = log.concat(JSON.stringify(str)).concat(' ')
        }
    });
    return log;
}

abstract class PipeTask<I extends InputWithPreviousInputs, O extends OutputWithStatus> {

    public static TASK_VARIANT_NAME: string;
    public static TASK_TYPE_NAME: string;
    public static LOGGING_LEVEL: number = 5;


    private taskVariantName: string;
    private taskTypeName: string;
    public isParallel = false;
    public input: I;
    public outputs: O[];
    public status: boolean;
    public error: string;
    public logs: string[] = [];

    private startTime: Number;
    private endTime: Number;

    constructor(taskTypeName: string, taskVariantName: string) {
        this.taskTypeName = taskTypeName;
        this.taskVariantName = taskVariantName;
    }

    protected onLog = function (...args: any[]) {
        this.logs.push(OnLog(args))
        if (PipeTask.LOGGING_LEVEL >= 2) {
            console.log(OnLog(args))
        }
    }



    public async _execute(pipeWorkInstance: PipeWorks, inputs: I): Promise<O[]> {
        this.init();
        try {
            let result = await this.execute(pipeWorkInstance, inputs);
            this.outputs = result;
            this.status = result && result.length > 0;
        } catch (e) {
            this.outputs = undefined;
            this.status = false;
            this.onLog("Error while executing task. ", e.message)
            console.log(e)
        }
        this.done();
        return this.outputs;
    }


    public getTaskTypeName(): string {
        return this.taskTypeName;
    }
    public getTaskVariantName(): string {
        return this.taskVariantName;
    }

    /**
     * Called before executing task
     */
    protected init(): any {
        this.startTime = Date.now()
    }

    /**
     * Called after executing task
     */
    protected done(): any {
        this.endTime = Date.now()
    }

    /**
     * Called when task is killed preemptively. Implement your stop task mechanism here.
     */
    abstract kill(): boolean;

    /**
     * Implement your task using this function. It will be called when task is executed
     * @param pipeWorkInstance PipeWorks instance
     * @param inputs Inputs include outputs of previous task and any additional inputs
     */
    abstract execute(pipeWorkInstance: PipeWorks, inputs: I): Promise<O[]>;

}

export { OnLog, InputWithPreviousInputs, OutputWithStatus };
export default PipeTask;