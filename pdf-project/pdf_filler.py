from fillpdf import fillpdfs
import PyPDF2

def fill_pdf(input_pdf_path, output_pdf_path, field_data):
    # Get the form fields from the input PDF
    # Print the form fields using print_form_fields function
    reader = PyPDF2.PdfReader(input_pdf_path)
    form_fields = reader.get_fields()
    print(form_fields.keys())
    
    # Fill the PDF with the provided data
    fillpdfs.write_fillable_pdf(input_pdf_path, output_pdf_path, field_data, flatten=False)

# Example usage
input_pdf = "easy-pdf.pdf"
output_pdf = "filled-pdf.pdf"
data = {
    "Identification no": "12534u4548",
    "Yr Model": 2014,
    "Lic Plate No": "1234567890",
    "Month": 10,
    "Day": 19,
    "Year-1": 2,
    "Year-2": 2,
    "Year-3": 2,
    "Year-4": 2,
    "Selling Price": 10000
}

fill_pdf(input_pdf, output_pdf, data)
