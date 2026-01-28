"use server"

export async function sendDocumentByEmail(patientEmail: string, documentUrl: string, documentName: string) {
    if (!patientEmail) {
        return { error: "El paciente no tiene un email registrado." }
    }

    try {
        // Simulation of email sending
        // In a real implementation, we would use Resend, SendGrid, or Nodemailer here.
        console.log(`[Mock Email] Sending document "${documentName}" (${documentUrl}) to ${patientEmail}`)

        await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate network delay

        return { success: true }
    } catch (error) {
        console.error("Error sending email:", error)
        return { error: "Error al enviar el correo electrónico." }
    }
}
