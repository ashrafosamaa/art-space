import ExcelJS from 'exceljs';
import { DateTime } from 'luxon';
import Order from '../../../DB/models/order.model.js';
import sendEmailService from '../../servcies/send-email-service.js';

export const ordersReport = async (req, res, next) => {
    // Function to create the Excel sheet
    async function createExcelSheet(orders) {
        // Create a new workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Orders');
        // Define the columns in the Excel sheet
        worksheet.columns = [
            { header: 'Order ID', key: 'orderId', width: 30 },
            { header: 'Customer Name', key: 'customerName', width: 30 },
            { header: 'Payment Method', key: 'paymentMethod', width: 20 },
            { header: 'Order Status', key: 'orderStatus', width: 15 },
            { header: 'Order Date', key: 'orderDate', width: 12 },
            { header: 'Order Items', key: 'totalItems', width: 30 },
            { header: 'Total Amount', key: 'totalAmount', width: 15 },
            // Add more columns as needed
        ];
        if(!orders.length) {
            worksheet.addRow({
                orderId: 'N/A',
                customerName: "N/A",
                paymentMethod: "N/A",
                orderStatus: "N/A",
                orderDate: "N/A",
                totalItems: "N/A", // Join order item titles
                totalAmount: "N/A",
                // Add more columns as needed
            });
        }
        // Populate the worksheet with order data
        orders.forEach((order) => {
            worksheet.addRow({
                orderId: order._id,
                customerName: order.user.userName,
                paymentMethod: order.paymentMethod,
                orderStatus: order.orderStatus,
                orderDate: order.createdAt,
                totalItems: order.orderItems.map(item => item.title).join(', '), // Join order item titles
                totalAmount: " " + order.totalPrice + ' EGP',
                // Add more columns as needed
            });
        });
        // Save the workbook to a file
        const filePath = `./files/Reports/orders_report_${DateTime.now().toFormat('yyyyLL')}.xlsx`;
        await workbook.xlsx.writeFile(filePath);
        return filePath;
    }
    // Retrieve orders from the previous month
    const startDate = DateTime.now().startOf('month').minus({ months: 1 });
    const endDate = DateTime.now().startOf('month').minus({ days: 1 });
    const orders = await Order.find(
        {
            createdAt: {
                $gte: startDate.toJSDate(),
                $lte: endDate.toJSDate(),
            },
        }
    ).populate('user', 'userName')
    
    createExcelSheet(orders)
        .then(async (filePath)=> {
            console.log(`Excel sheet saved to: ${filePath}`);
            try {
                await sendEmailService({
                    to: process.env.EMAIL_FOR_REPORTS,
                    subject: 'Orders Report',
                    message: '<h1>Check the Excel Sheet for Orders Report</h1>',
                    attachments: [{path: filePath}]
                })
            } catch (error) {
                return next(new Error("An error occurred while sending email, plesae try again", { cause: 500 }))
            }
            res.status(200).json({
                msg: 'Excel sheet created successfully',
                statusCode: 200,
            });
        })
        .catch((error) => {
            console.error('Error creating Excel sheet:', error);
            res.status(400).json({
                msg: 'Error happened',
                statusCode: 400,
            });
        });
}
