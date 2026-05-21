def extractData(cliResult):
    list=cliResult.strip().split("\n")
    cleanList = [x for x in list if x.startswith("- ") and "HEAD" not in x]
    result = [x.split(" ")[1] for x in cleanList]
    return result

def processDeployments(cliResult):
    result=extractData(cliResult)
    return result

clasp push
cliResult=$(clasp deployments)
list= processDeployments(cliResult)
print(list)
print(len(list))
main=''
ENDPOINT=''
if len(list)>=1:
    main=list[0]
    ENDPOINT="https://script.google.com/macros/s/"+ main+"/exec"
    for i, d in enumerate(list):
        if i >1: 
            id=d
            print("Undeploy: " +d)
            clasp undeploy @(id)  
    description="Refresh: " + main
    print(description)    
    clasp push
    clasp deploy --deploymentId @(main) -d @(description)
else:
    cliResult=$(clasp deploy -d "new deployment")
    list= extractData(cliResult)
    main=list[0]
    ENDPOINT="https://script.google.com/macros/s/"+ main+"/exec"

print("================== Endpoint ==================\n")
print(ENDPOINT)
open-cli @(ENDPOINT)