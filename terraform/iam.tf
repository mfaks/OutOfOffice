resource "aws_iam_role" "backend_ec2" {
    name = "${var.project_name}-backend-ec2-role"

    assume_role_policy = jsonencode({
        Version = "2012-10-17"
        Statement = [{
            Effect    = "Allow"
            Principal = { Service = "ec2.amazonaws.com" }
            Action    = "sts:AssumeRole"
        }]
    })
}

# Allows the instance to pull images from ECR without static credentials
resource "aws_iam_role_policy_attachment" "backend_ecr" {
    role       = aws_iam_role.backend_ec2.name
    policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

# Allows shell access via SSM Session Manager without needing SSH or an open port 22
resource "aws_iam_role_policy_attachment" "backend_ssm" {
    role       = aws_iam_role.backend_ec2.name
    policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "backend" {
    name = "${var.project_name}-backend-profile"
    role = aws_iam_role.backend_ec2.name
}
