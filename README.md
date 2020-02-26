### Packaging Application
<pre><code>
sam package --template-file sam-template.yaml --s3-bucket <b>your_bucket</b> --output-template-file sam-output-template.yaml
</code></pre>
### Deploying Application
<pre><code>
sam deploy --template-file sam-output-template.yaml --stack-name <b>your_name</b> --capabilities CAPABILITY_IAM
</code></pre>

[Master](https://github.com/pkhafizov/aws-xray-sample/tree/master)

[Custom subsegment](https://github.com/pkhafizov/aws-xray-sample/tree/customtrace)