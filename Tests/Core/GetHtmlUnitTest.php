<?php

require_once 'AbstractViperUnitTest.php';

class Viper_Tests_Core_GetHtmlUnitTest extends AbstractViperUnitTest
{


    /**
     * Test getHTML strips the viper tags when a word is selected in viper
     *
     * @return void
     */
    public function testGetHtmlForWords()
    {
        $this->useTest(1);
        $this->moveToKeyword(1);
        $this->_checkGetHTML('<h1>%1% Heading</h1><p>Lorem XuT dolor sit <em>amet</em> <strong>WoW</strong></p>');

    }//end testGetHtmlForParagraphs()


    /**
     * Test getHTML strips the viper tags when a paragraph is selected in viper
     *
     * @return void
     */
    public function testGetHtmlForParagraphs()
    {
        $this->useTest(2);

        $this->moveToKeyword(1);
        $this->_checkGetHTML('<h1>%1% Heading</h1><p style="text-align: center;">Lorem XuT dolor sit <em>amet</em> <strong>WoW</strong></p><h2>Second Heading</h2><p style="text-align: right;">This is <del>SOME</del> <span class="myclass">information</span> for <a href="http://www.google.com" title="Google">testing</a></p><p>Another paragraph</p><ul style="text-align: center;"><li>Test removing bullet points</li><li style="text-align: right;">purus <u>oNo</u> luctus</li><li>vel molestie arcu</li></ul><div>&nbsp;</div><hr /><p>This is a <sub>sub</sub> script. This is a <sup>super</sup> script</p>');

    }//end testGetHtmlForParagraphs()


    /**
     * Test getHTML returns the correct strucutre for images when it is selected in viper.
     *
     * @return void
     */
    public function testGetHtmlForImages()
    {
        $this->useTest(3);

        $this->moveToKeyword(1);
        $this->_checkGetHTML('<h1>%1% Heading</h1><p style="text-align: center;">Lorem XuT dolor sit <em>amet</em> <strong>WoW</strong></p><p><img alt="" src="%url%/ViperImagePlugin/Images/html-codesniffer.png" />&nbsp;</p>');

    }//end testGetHtmlForImages()


    /**
     * Test getHTML returns the correct structure for a table.
     *
     * @return void
     */
    public function testGetHtmlForTables()
    {
        $this->useTest(4);

        $this->moveToKeyword(1);
        $this->_checkGetHTML('<table border="1" cellpadding="2" cellspacing="3" id="test"><caption style="text-align:left;"><strong>Table 1.2:</strong> The table %1% text goes here la</caption><tbody><tr><td></td><th id="testr1c2"></th><th id="testcell">Col3 Header</th><th id="testr1c4">Col4 Header </th></tr><tr><td>UnaU <sub>TiuT</sub> XabcX Mnu</td><td headers="testr1c2"><strong><em>WoW</em></strong> sapien vel aliquet</td><td headers="testcell">test cell</td><td headers="testr1c4"><ul><li><span class="myclass">vel </span>molestie arcu</li><li>purus <del>neque </del>luctus</li><li>vel <sup>molestie</sup> arcu</li></ul></td></tr><tr><td><h3>Squiz Labs</h3></td><td colspan="3" headers="testcell testr1c2 testr1c4">purus <span>neque </span>luctus <strong><a href="http://www.google.com">ligula</a></strong>, vel molestie arcu </td></tr><tr><td>nec <strong>porta</strong> ante </td><td headers="testr1c2">sapien vel aliquet</td><td rowspan="2" headers="testcell">&nbsp;</td><td rowspan="2" headers="testr1c4">purus neque luctus ligula, vel molestie arcu </td></tr><tr><td colspan="2" headers="testr1c2">sapien vel aliquet</td></tr></tbody></table>');

    }//end testGetHtmlForTables()


    /**
     * Test getHTML removes __viperMarker.
     *
     * @return void
     */
    public function testGetHtmlRemovesMarker()
    {
        $this->useTest(5);

        $this->moveToKeyword(1);
        $this->_checkGetHTML('<h1>%1% Heading</h1><p>Lorem <span class="__viperMarker">XuT</span> dolor sit <em>amet</em> <strong>WoW</strong></p>');

    }//end testGetHtmlRemovesMarker()


    /**
     * Test getHTML removes viperBookmark.
     *
     * @return void
     */
    public function testGetHtmlRemovesBookmark()
    {
        $this->useTest(6);

        $this->moveToKeyword(1);
        $this->_checkGetHTML('<h1>%1% Heading</h1><p style="text-align: center;">Lorem XuT dolor sit <em>amet</em> <strong>WoW</strong></p><h2>Second Heading</h2><p style="text-align: right;">This is <del>SOME</del> <span class="myclass">information</span> for <a href="http://www.google.com" title="Google">testing</a></p><ul style="text-align: center;"><li>Test removing bullet points</li><li style="text-align: right;">purus <u>oNo</u> luctus</li><li>vel molestie arcu</li></ul>');

    }//end testGetHtmlRemovesBookmark()


    /**
     * Test getHTML doesn't remove iframe tags.
     *
     * @return void
     */
    public function testGetHtmlDoesNotRemoveIframeTags()
    {
        $this->useTest(7);

        $this->moveToKeyword(1);
        $this->_checkGetHTML('<h1>%1% Heading</h1><iframe src="http://www.w3schools.com"></iframe><p>Lorem XuT dolor sit <em>amet</em> <strong>WoW</strong></p>');

    }//end testGetHtmlDoesNotRemoveIframeTags()


    /**
     * Test getHTML doesn't remove empty anchor tags.
     *
     * @return void
     */
    public function testGetHtmlDoesNotRemoveAnchorTags()
    {
        $this->useTest(8);

        $this->moveToKeyword(1);
        $this->_checkGetHTML('<h1>%1% Heading</h1><a href="#test">Test</a><p style="text-align: center;">Lorem XuT dolor sit <em>amet</em> <strong>WoW</strong></p><h2><a name="test"></a>Second Heading</h2><p style="text-align: right;">This is <del>SOME</del> <span class="myclass">information</span> for <a href="http://www.google.com" title="Google">testing</a></p>');

    }//end testGetHtmlDoesNotRemoveAnchorTags()


    /**
     * Test getHTML removes the <br/> when it is before a closing inline element.
     *
     * @return void
     */
    public function testGetHtmlRemovesBreakTagsBeforeClosingInlineElements()
    {
        $this->useTest(9);

        $this->moveToKeyword(1);
        $this->_checkGetHTML('<p>asdas <strong>%1%</strong> asdas</p><p>asdas <em>%2%</em> asdas</p><p>asdas <span>%3%</span> asdas</p><p>asdas <sub>%4%</sub> asdas</p><p>asdas <sup>%5%</sup> asdas</p><p>asdas <del>%6%</del> asdas</p>');

    }//end testGetHtmlRemovesBreakTagsBeforeClosingInlineElements()


    /**
     * Test getHTML doesn't remove the <br/> when it is after a closing inline element.
     *
     * @return void
     */
    public function testGetHtmlLeavesBreakTagsAfterClosingInlineElements()
    {
        $this->useTest(10);

        $this->moveToKeyword(1);
        $this->_checkGetHTML('<p>asdas <strong>%1%</strong><br /> asdas</p><p>asdas <em>%2%</em><br /> asdas</p><p>asdas <span>%3%</span><br /> asdas</p><p>asdas <sub>%4%</sub><br /> asdas</p><p>asdas <sup>%5%</sup><br /> asdas</p><p>asdas <del>%6%</del><br /> asdas</p>');

    }//end testGetHtmlLeavesBreakTagsAfterClosingInlineElements()


    /**
     * Checks that expected HTML matches the returned HTML.
     *
     * @param string $expectedHTML The expected HTML that will be returned by Viper.
     *
     */
    private function _checkGetHTML($expectedHTML)
    {
        $this->assertHTMLMatch($expectedHTML);

    }//end _checkGetHTML()


}//end class

?>
