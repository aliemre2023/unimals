import torch
from torchvision import transforms
from torchvision.models import resnet18

# Load ResNet18 (excluding final classification layer)
resnet = resnet18(pretrained=True)
resnet.eval()
resnet = torch.nn.Sequential(*list(resnet.children())[:-1])

# Transformation for ResNet input
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
])