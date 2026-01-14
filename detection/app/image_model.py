import torch
import torchvision.transforms as transforms
import torchvision.models as models
from torchvision.models import ResNet18_Weights
import torch.nn as nn
from PIL import Image

# Pretrained CNN
model = models.resnet18(weights=ResNet18_Weights.DEFAULT)
model.fc = nn.Linear(model.fc.in_features, 2)  # real / fake
model.eval()

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor()
])

def image_risk(image_path):
    try:
        img = Image.open(image_path).convert("RGB")
        img = transform(img).unsqueeze(0)

        with torch.no_grad():
            output = model(img)
            score = torch.softmax(output, dim=1)[0][1].item()

        return score
    except Exception as e:
        print(f"Image risk prediction error: {str(e)}")
        return 0.5  # Default medium risk on error
