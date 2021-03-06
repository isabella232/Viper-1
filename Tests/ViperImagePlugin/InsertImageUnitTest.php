<?php

require_once 'AbstractViperImagePluginUnitTest.php';

class Viper_Tests_ViperImagePlugin_InsertImageUnitTest extends AbstractViperImagePluginUnitTest
{

    /**
     * Test when you don't insert text into the alt field the alt attribute still appears in the source code.
     *
     * @return void
     */
    public function testInsertingImageWithoutAltAndTitle()
    {
        $this->useTest(1);

        $this->moveToKeyword(1, 'right');
        $this->clickTopToolbarButton('image');
        $this->type($this->getTestURL('/ViperImagePlugin/Images/editing.png'));
        $this->clickField('Image is decorative');
        $this->sikuli->keyDown('Key.ENTER');
        sleep(1);
        $this->assertHTMLMatch('<p>%1%<img src="%url%/ViperImagePlugin/Images/editing.png" alt=""/> Content to test inserting images</p><p>Another paragraph in the content %2%</p>');

        $this->selectKeyword(2);
        sleep(1);
        $this->clickTopToolbarButton('image');
        $this->type($this->getTestURL('/ViperImagePlugin/Images/editing.png'));
        $this->clickField('Image is decorative');
        sleep(1);
        $this->clickTopToolbarButton('Insert Image', NULL, TRUE);
        $this->assertHTMLMatch('<p>%1%<img src="%url%/ViperImagePlugin/Images/editing.png" alt=""/> Content to test inserting images</p><p>Another paragraph in the content <img src="%url%/ViperImagePlugin/Images/editing.png" alt=""/></p>');

    }//end testInsertingImageWithoutAltAndTitle()


    /**
     * Test inserting an image with an alt tag.
     *
     * @return void
     */
    public function testInsertingImageWithAltTag()
    {
        $this->useTest(1);

        $this->moveToKeyword(1, 'right');
        $this->clickTopToolbarButton('image');
        $this->type($this->getTestURL('/ViperImagePlugin/Images/editing.png'));
        $this->sikuli->keyDown('Key.TAB');
        $this->type('Alt tag');
        $this->sikuli->keyDown('Key.ENTER');
        $this->assertHTMLMatch('<p>%1%<img src="%url%/ViperImagePlugin/Images/editing.png" alt="Alt tag"/> Content to test inserting images</p><p>Another paragraph in the content %2%</p>');

        $this->selectKeyword(2);
        $this->clickTopToolbarButton('image');
        $this->type($this->getTestURL('/ViperImagePlugin/Images/editing.png'));
        $this->sikuli->keyDown('Key.TAB');
        $this->type('Another Alt tag');
        sleep(1);
        $this->clickTopToolbarButton('Insert Image', NULL, TRUE);
        $this->assertHTMLMatch('<p>%1%<img src="%url%/ViperImagePlugin/Images/editing.png" alt="Alt tag"/> Content to test inserting images</p><p>Another paragraph in the content <img src="%url%/ViperImagePlugin/Images/editing.png" alt="Another Alt tag"/></p>');

    }//end testInsertingImageWithAltTag()


    /**
     * Test inserting an image with the alt and title.
     *
     * @return void
     */
    public function testInsertingImageWithAltAndTitleTag()
    {
        $this->useTest(1);

        $this->moveToKeyword(1, 'right');
        $this->clickTopToolbarButton('image');
        $this->type($this->getTestURL('/ViperImagePlugin/Images/editing.png'));
        $this->sikuli->keyDown('Key.TAB');
        $this->type('Alt tag');
        $this->sikuli->keyDown('Key.TAB');
        $this->type('Title tag');
        $this->sikuli->keyDown('Key.ENTER');
        $this->assertHTMLMatch('<p>%1%<img src="%url%/ViperImagePlugin/Images/editing.png" alt="Alt tag" title="Title tag"/> Content to test inserting images</p><p>Another paragraph in the content %2%</p>');

        $this->selectKeyword(2);
        $this->clickTopToolbarButton('image');
        $this->type($this->getTestURL('/ViperImagePlugin/Images/editing.png'));
        $this->sikuli->keyDown('Key.TAB');
        $this->type('Another Alt tag');
        $this->sikuli->keyDown('Key.TAB');
        $this->type('Another Title tag');
        sleep(1);
        $this->clickTopToolbarButton('Insert Image', NULL, TRUE);
        $this->assertHTMLMatch('<p>%1%<img src="%url%/ViperImagePlugin/Images/editing.png" alt="Alt tag" title="Title tag"/> Content to test inserting images</p><p>Another paragraph in the content <img src="%url%/ViperImagePlugin/Images/editing.png" alt="Another Alt tag" title="Another Title tag"/></p>');

    }//end testInsertingWithAltAndTitleTag()


    /**
     * Test clicking image is decorative while inserting an image.
     *
     * @return void
     */
    public function testChangingIsDecorativeWhileInsertingImage()
    {
        // Switch Is Decorative after inserting an alt tag
        $this->useTest(1);

        $this->moveToKeyword(1, 'right');
        $this->clickTopToolbarButton('image');
        $this->type($this->getTestURL('/ViperImagePlugin/Images/editing.png'));
        $this->sikuli->keyDown('Key.TAB');
        $this->type('Alt tag');
        $this->clickField('Image is decorative');
        sleep(1);
        $this->sikuli->keyDown('Key.ENTER');
        sleep(1);
        $this->assertHTMLMatch('<p>%1%<img src="%url%/ViperImagePlugin/Images/editing.png" alt=""/> Content to test inserting images</p><p>Another paragraph in the content %2%</p>');

        $this->selectKeyword(2);
        sleep(1);
        $this->clickTopToolbarButton('image');
        $this->type($this->getTestURL('/ViperImagePlugin/Images/editing.png'));
        $this->sikuli->keyDown('Key.TAB');
        $this->type('Alt tag');
        $this->clickField('Image is decorative');
        sleep(1);
        $this->clickTopToolbarButton('Insert Image', NULL, TRUE);
        $this->assertHTMLMatch('<p>%1%<img src="%url%/ViperImagePlugin/Images/editing.png" alt=""/> Content to test inserting images</p><p>Another paragraph in the content <img src="%url%/ViperImagePlugin/Images/editing.png" alt=""/></p>');

        // Switch Is Decorative after inserting an alt and title tag
        $this->useTest(1);
        $this->moveToKeyword(1, 'right');
        $this->clickTopToolbarButton('image');
        $this->type($this->getTestURL('/ViperImagePlugin/Images/editing.png'));
        $this->sikuli->keyDown('Key.TAB');
        $this->type('Alt tag');
        $this->sikuli->keyDown('Key.TAB');
        $this->type('Title tag');
        $this->clickField('Image is decorative');
        sleep(1);
        $this->sikuli->keyDown('Key.ENTER');
        sleep(1);
        $this->assertHTMLMatch('<p>%1%<img src="%url%/ViperImagePlugin/Images/editing.png" alt=""/> Content to test inserting images</p><p>Another paragraph in the content %2%</p>');

        $this->selectKeyword(2);
        sleep(1);
        $this->clickTopToolbarButton('image');
        $this->type($this->getTestURL('/ViperImagePlugin/Images/editing.png'));
        $this->sikuli->keyDown('Key.TAB');
        $this->type('Alt tag');
        $this->sikuli->keyDown('Key.TAB');
        $this->type('Title tag');
        $this->clickField('Image is decorative');
        sleep(1);
        $this->clickTopToolbarButton('Insert Image', NULL, TRUE);
        $this->assertHTMLMatch('<p>%1%<img src="%url%/ViperImagePlugin/Images/editing.png" alt=""/> Content to test inserting images</p><p>Another paragraph in the content <img src="%url%/ViperImagePlugin/Images/editing.png" alt=""/></p>');

    }//end testChangingIsDecorativeWhileInsertingImage()


    /**
     * Test trying to insert an image without alt or title tag.
     *
     * @return void
     */
    public function testTryingToInsertImageWithoutAltOrTitle()
    {
        $this->useTest(1);

        $this->moveToKeyword(1, 'right');
        $this->clickTopToolbarButton('image');
        $this->type($this->getTestURL('/ViperImagePlugin/Images/editing.png'));
        $this->sikuli->keyDown('Key.ENTER');
        // The image should not have been inserted into the content as there is no alt tag
        $this->assertHTMLMatch('<p>%1% Content to test inserting images</p><p>Another paragraph in the content %2%</p>');
        // Add title tag
        $this->clickField('Title');
        $this->type('Title tag');
        $this->sikuli->keyDown('Key.ENTER');
        sleep(1);
        // The image should not have been inserted into the content as there is no alt tag
        $this->assertHTMLMatch('<p>%1% Content to test inserting images</p><p>Another paragraph in the content %2%</p>');
        // Add alt tag
        $this->clickField('Alt', TRUE);
        $this->type('Alt tag');
        $this->sikuli->keyDown('Key.ENTER');
        $this->assertHTMLMatch('<p>%1%<img src="%url%/ViperImagePlugin/Images/editing.png" alt="Alt tag" title="Title tag"/> Content to test inserting images</p><p>Another paragraph in the content %2%</p>');

        $this->selectKeyword(2);
        $this->clickTopToolbarButton('image');
        $this->type($this->getTestURL('/ViperImagePlugin/Images/editing.png'));
        $this->sikuli->keyDown('Key.ENTER');
        sleep(1);
        // The image should not have been inserted into the content as there is no alt tag
        $this->assertHTMLMatch('<p>%1%<img src="%url%/ViperImagePlugin/Images/editing.png" alt="Alt tag" title="Title tag"/> Content to test inserting images</p><p>Another paragraph in the content %2%</p>');
        // Add title tag
        $this->clickField('Title');
        sleep(1);
        $this->type('Another Title tag');
        $this->sikuli->keyDown('Key.ENTER');
        sleep(1);
        // The image should not have been inserted into the content as there is no alt tag
        $this->assertHTMLMatch('<p>%1%<img src="%url%/ViperImagePlugin/Images/editing.png" alt="Alt tag" title="Title tag"/> Content to test inserting images</p><p>Another paragraph in the content %2%</p>');
        // Add alt tag
        $this->clickField('Alt', TRUE);
        $this->type('Another Alt tag');
        $this->clickTopToolbarButton('Insert Image', NULL, TRUE);
        sleep(1);
        $this->assertHTMLMatch('<p>%1%<img src="%url%/ViperImagePlugin/Images/editing.png" alt="Alt tag" title="Title tag"/> Content to test inserting images</p><p>Another paragraph in the content <img src="%url%/ViperImagePlugin/Images/editing.png" alt="Another Alt tag" title="Another Title tag"/></p>');

    }//end testTryingToInsertImageWithoutAltOrTitle()


    /**
     * Test inserting an image in various parts of a paragraph.
     *
     * @return void
     */
    public function testInsertingImageInAParagraph()
    {
        // Inserting image at the start of a paragraph
        $this->useTest(1);
        $this->moveToKeyword(1, 'left');
        $this->clickTopToolbarButton('image');
        $this->type($this->getTestURL('/ViperImagePlugin/Images/editing.png'));
        sleep(1);
        $this->clickField('Image is decorative');
        $this->sikuli->keyDown('Key.ENTER');
        $this->assertHTMLMatch('<p><img src="%url%/ViperImagePlugin/Images/editing.png" alt=""/>%1% Content to test inserting images</p><p>Another paragraph in the content %2%</p>');
        $this->clickElement('img', 0);
        sleep(1);
        $this->assertTrue($this->inlineToolbarButtonExists('image', 'active'), 'Image icon should be active.');
        $this->assertTrue($this->inlineToolbarButtonExists('move'), 'Move icon should appear in the inline toolbar.');

        // Inserting image in the middle of a paragraph.
        $this->useTest(1);
        $this->moveToKeyword(1, 'right');
        $this->clickTopToolbarButton('image');
        $this->type($this->getTestURL('/ViperImagePlugin/Images/editing.png'));
        sleep(1);
        $this->clickField('Image is decorative');
        $this->sikuli->keyDown('Key.ENTER');
        $this->assertHTMLMatch('<p>%1%<img src="%url%/ViperImagePlugin/Images/editing.png" alt=""/> Content to test inserting images</p><p>Another paragraph in the content %2%</p>');
        $this->clickElement('img', 0);
        sleep(1);
        $this->assertTrue($this->inlineToolbarButtonExists('image', 'active'), 'Image icon should be active.');
        $this->assertTrue($this->inlineToolbarButtonExists('move'), 'Move icon should appear in the inline toolbar.');

        // Inserting image at the end of a paragraph
        $this->useTest(1);
        $this->moveToKeyword(2, 'right');
        $this->clickTopToolbarButton('image');
        $this->type($this->getTestURL('/ViperImagePlugin/Images/editing.png'));
        sleep(1);
        $this->clickField('Image is decorative');
        $this->sikuli->keyDown('Key.ENTER');
        $this->assertHTMLMatch('<p>%1% Content to test inserting images</p><p>Another paragraph in the content %2%<img src="%url%/ViperImagePlugin/Images/editing.png" alt=""/></p>');
        $this->clickElement('img', 0);
        sleep(1);
        $this->assertTrue($this->inlineToolbarButtonExists('image', 'active'), 'Image icon should be active.');
        $this->assertTrue($this->inlineToolbarButtonExists('move'), 'Move icon should appear in the inline toolbar.');

        // Inserting image in new paragraph
        $this->useTest(1);
        $this->moveToKeyword(2, 'right');
        $this->sikuli->keyDown('Key.ENTER');
        $this->clickTopToolbarButton('image');
        $this->type($this->getTestURL('/ViperImagePlugin/Images/editing.png'));
        sleep(1);
        $this->clickField('Image is decorative');
        $this->sikuli->keyDown('Key.ENTER');
        $this->assertHTMLMatch('<p>%1% Content to test inserting images</p><p>Another paragraph in the content %2%</p><p><img src="%url%/ViperImagePlugin/Images/editing.png" alt=""/></p>');
        $this->clickElement('img', 0);
        sleep(1);
        $this->assertTrue($this->inlineToolbarButtonExists('image', 'active'), 'Image icon should be active.');
        $this->assertTrue($this->inlineToolbarButtonExists('move'), 'Move icon should appear in the inline toolbar.');

    }//end testInsertingImageInAParagraph()


    /**
     * Test trying to insert an image with the incorrect URL.
     *
     * @return void
     */
    public function testInsertingImageWithIncorrectURL()
    {
        $this->useTest(1);

        $this->moveToKeyword(1, 'right');

        $this->clickTopToolbarButton('image');
        $this->type('http://www.squizlabs.com/editing.png');
        sleep(2);
        $this->clickField('Image is decorative');
        sleep(2);
        $this->findImage('ViperImagePlugin-loadError', '.Viper-textbox-error');
        sleep(2);
        $this->sikuli->keyDown('Key.ENTER');
        sleep(2);
        $this->assertHTMLMatch('<p>%1%<img src="http://www.squizlabs.com/editing.png" alt="" /> Content to test inserting images</p><p>Another paragraph in the content %2%</p>');

    }//end testInsertingImageWithIncorrectURL()


     /**
     * Test that inserting image with no base tag specified works.
     *
     * @return void
     */
    public function testInsertingImageWithNoBaseTag()
    {
        $this->sikuli->execJS('viper.setSetting("defaultBlockTag", "")');

        $this->useTest(2);
        $this->selectKeyword(1, 2);
        $this->clickTopToolbarButton('image');
        $this->type($this->getTestURL('/ViperImagePlugin/Images/editing.png'));
        sleep(1);
        $this->clickField('Image is decorative');
        sleep(1);
        $this->sikuli->keyDown('Key.ENTER');
        sleep(1);
        $this->assertHTMLMatch('<img alt="" src="%url%/ViperImagePlugin/Images/editing.png" />');

        $this->useTest(2);
        $this->moveToKeyword(1, 'right');
        $this->clickTopToolbarButton('image');
        $this->type($this->getTestURL('/ViperImagePlugin/Images/editing.png'));
        sleep(1);
        $this->clickField('Image is decorative');
        sleep(1);
        $this->sikuli->keyDown('Key.ENTER');
        sleep(1);
        $this->assertHTMLMatch('%1%<img alt="" src="%url%/ViperImagePlugin/Images/editing.png" /> %2%');

        $this->useTest(2);
        $this->selectKeyword(1, 2);
        $this->sikuli->keyDown('Key.DELETE');
        $this->clickTopToolbarButton('image');
        $this->type($this->getTestURL('/ViperImagePlugin/Images/editing.png'));
        sleep(1);
        $this->clickField('Image is decorative');
        sleep(1);
        $this->sikuli->keyDown('Key.ENTER');
        sleep(1);
        $this->assertHTMLMatch('<img alt="" src="%url%/ViperImagePlugin/Images/editing.png" />');

    }//end testInsertingImageWithNoBaseTag()


    /**
     * Test inserting and editing an image.
     *
     * @return void
     */
    public function testInsertAndEditImage()
    {
        $this->useTest(1);

        $this->moveToKeyword(1, 'right');
        $this->clickTopToolbarButton('image');
        $this->type($this->getTestURL('/ViperImagePlugin/Images/editing.png'));
        $this->clickField('Image is decorative');
        $this->clickTopToolbarButton('Insert Image', NULL, TRUE);
        sleep(1);
        $this->assertHTMLMatch('<p>%1%<img src="%url%/ViperImagePlugin/Images/editing.png" alt=""/> Content to test inserting images</p><p>Another paragraph in the content %2%</p>');

        $this->clickField('Image is decorative');
        sleep(1);
        $this->clickField('Alt', TRUE);
        $this->type('alt tag');
        $this->clickTopToolbarButton('Update Image', NULL, TRUE);
        sleep(1);
        $this->assertHTMLMatch('<p>%1%<img src="%url%/ViperImagePlugin/Images/editing.png" alt="alt tag"/> Content to test inserting images</p><p>Another paragraph in the content %2%</p>');

        // Check alt field to make sure it has not been cleared
        $this->assertEquals('alt tag', $this->getFieldValue('Alt'), 'Alt field should not be empty');

        // Edit the image again
        $this->moveToKeyword(2);
        $this->clickElement('img', 0);
        $this->clickTopToolbarButton('image', 'active');
        $this->clickField('Image is decorative');
        sleep(1);
        $this->clickTopToolbarButton('Update Image', NULL, TRUE);
        sleep(1);
        $this->assertHTMLMatch('<p>%1%<img src="%url%/ViperImagePlugin/Images/editing.png" alt=""/> Content to test inserting images</p><p>Another paragraph in the content %2%</p>');

        // Check URL field to make sure it has not been clearerd
        $urlValue = $this->getTestURL('/ViperImagePlugin/Images/editing.png');
        $this->assertEquals($urlValue, $this->getFieldValue('URL'), 'URL field should not be empty');

    }//end testInsertAndEditImage()


}//end class

?>
