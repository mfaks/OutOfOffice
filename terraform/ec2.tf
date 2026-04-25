# SSH restricted to the machine running terraform apply by default; override with monitoring_cidr
resource "aws_security_group" "backend" {
    name        = "${var.project_name}-backend-sg"
    description = "Allow inbound traffic to the backend"
    vpc_id      = aws_vpc.main.id

    # Allow inbound traffic to the backend API
    ingress {
        description = "Backend API"
        from_port   = 8000
        to_port     = 8000
        protocol    = "tcp"
        cidr_blocks = ["0.0.0.0/0"]
    }

    # Allow SSH access from the monitoring CIDR (default to the machine running terraform apply)
    ingress {
        description = "SSH"
        from_port   = 22
        to_port     = 22
        protocol    = "tcp"
        cidr_blocks = [coalesce(var.monitoring_cidr, "${chomp(data.http.my_ip.response_body)}/32")]
    }

    # Allow all outbound traffic
    egress {
        from_port   = 0
        to_port     = 0
        protocol    = "-1"
        cidr_blocks = ["0.0.0.0/0"]
    }

    tags = { Name = "${var.project_name}-backend-sg" }
}

data "aws_ami" "amazon_linux" {
    most_recent = true
    owners      = ["amazon"]

    filter {
        name   = "name"
        values = ["al2023-ami-2023.*-kernel-*-x86_64"]
    }

    filter {
        name   = "state"
        values = ["available"]
    }
}

resource "aws_instance" "backend" {
    ami                         = data.aws_ami.amazon_linux.id
    instance_type               = var.instance_type
    subnet_id                   = aws_subnet.public.id
    vpc_security_group_ids      = [aws_security_group.backend.id]
    iam_instance_profile        = aws_iam_instance_profile.backend.name
    associate_public_ip_address = true

    # User data script to run on boot
    user_data = base64encode(templatefile("${path.module}/userdata.sh.tpl", {
        aws_region      = var.aws_region
        ecr_url         = aws_ecr_repository.backend.repository_url
        image_tag       = var.image_tag
        serpapi_api_key = var.serpapi_api_key
        openai_api_key  = var.openai_api_key
        cors_origins    = "*"
    }))

    tags = { Name = "${var.project_name}-backend" }

    depends_on = [null_resource.push_backend_image]
}
