
module.exports = app => {
    const { router, controller } = app;
    router.get('/', controller.home.index);

    router.get('/teachingMaterial/add', controller.teachingMaterial.Add);
    router.get('/teachingMaterial/delete', controller.teachingMaterial.Delete);

    router.get('/catalog/add', controller.catalog.Add);
    router.get('/catalog/delete', controller.catalog.Delete);

    
    router.get('/question/add', controller.question.Add);
    router.get('/question/delete', controller.question.Delete);
    router.get('/questionset/delete', controller.question.DeleteQuestionSet);
    router.get('/answer/delete', controller.question.DeleteAnswer);
};



