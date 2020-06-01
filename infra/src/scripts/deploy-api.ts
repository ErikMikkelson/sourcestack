import { execute } from "../util/execute";
import { writeFileSync } from "fs";
import { Config } from "../util/config";
import { fromStack, StackOutput } from "../stackoutput";
import {BackendConfig} from '../../../api/src/backendconfig';
let jwkToPem = require('jwk-to-pem');

(async () => {
    await execute(`cd ../api && npm run build`);
    let stackOutputs = await fromStack(Config.instance.appEnv);
    await writeBackendConfig('../api/dist', stackOutputs);
    await execute(`cd ../api/dist && zip ../dist.zip *`);
    await execute(`aws lambda --region eu-west-1 update-function-code --function-name ${stackOutputs.FunctionName} --zip-file fileb://../api/dist.zip`);
    console.log('Published ' + stackOutputs.FunctionName);
})();

export async function writeBackendConfig(dir: string, stackOutput: StackOutput){
    let backendConfig: BackendConfig = {
        app: Config.instance.app,
        env: Config.instance.env,
        UserPoolId: stackOutput.UserPoolId, 
        UserPoolClientId: stackOutput.UserPoolClientId,
        kidToPems: await getKidToPems(stackOutput.UserPoolId)
    }
    writeFileSync(dir + '/backend-config.json', JSON.stringify(backendConfig, null, 2));
}

async function getKidToPems(userPoolId: string){
    let curlOutput = await execute(`curl -s https://cognito-idp.eu-west-1.amazonaws.com/${userPoolId}/.well-known/jwks.json`)
    let jwks = JSON.parse(curlOutput.stdout);
    let kidToPems:any = {};
    for (let key of jwks.keys){
        let pem = jwkToPem(key);
        kidToPems[key.kid] = pem;
    }
    return kidToPems;
}