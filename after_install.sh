rm -f terraform.tfstate 
rm -f .terraform.tfstate.lock.info
cdktf get
npm install cdktf-gke-auth --force --no-save
exit 0